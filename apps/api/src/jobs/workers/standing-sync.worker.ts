/**
 * standing-sync worker — fetches standings from API-Football and upserts to DB.
 */
import { Worker } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';
import { createLogger } from '@core/logger.js';
import { footballApiGet } from '@infrastructure/http/football-api.client.js';
import { db } from '@infrastructure/database/client.js';
import { leagues, teams } from '@infrastructure/database/schema.js';
import { sql, eq } from 'drizzle-orm';
import { standingsService } from '@modules/standings/standings.service.js';
import { leaguesCache } from '@modules/leagues/leagues.cache.js';
import { normalizeStandingEntry, normalizeStandingZone } from '@providers/api-football/normalizer.js';
import { QUEUE_COMPLETED_JOBS_RETAIN, QUEUE_FAILED_JOBS_RETAIN } from '@config/constants.js';

const logger = createLogger('worker:standing-sync');

async function syncStandings(): Promise<void> {
  // Get all active leagues with their API-Football external IDs
  const { rows } = await db.execute(sql`
    SELECT id, name, season, provider_ref->>'apiFootball' AS ext_id
    FROM leagues
    WHERE is_active = true
      AND provider_ref->>'apiFootball' IS NOT NULL
      AND provider_ref->>'apiFootball' != ''
    ORDER BY name
  `);

  logger.info({ count: (rows as any[]).length }, 'Syncing standings for leagues');

  let total = 0; let failed = 0;

  for (const league of rows as any[]) {
    try {
      const raw = await footballApiGet(`/standings?league=${league.ext_id}&season=${league.season}`);
      const groups = (raw as any)?.response?.[0]?.league?.standings;
      if (!groups || !Array.isArray(groups)) continue;

      // standings can be array of arrays (groups) or flat array
      const allEntries = groups.flat();
      if (!allEntries.length) continue;

      const entries: any[] = [];

      for (const entry of allEntries) {
        try {
          // Find team by external ID
          const teamRows = await db.select({ id: teams.id })
            .from(teams)
            .where(sql`provider_ref->>'apiFootball' = ${String(entry.team.id)}`)
            .limit(1);

          if (!teamRows[0]) continue;

          const normalized = normalizeStandingEntry(
            entry,
            String(league.ext_id),
            String(league.season),
          );

          entries.push({
            leagueId:     league.id,
            teamId:       teamRows[0].id,
            season:       String(league.season),
            position:     normalized.data.position,
            played:       normalized.data.played,
            wins:         normalized.data.wins,
            draws:        normalized.data.draws,
            losses:       normalized.data.losses,
            goalsFor:     normalized.data.goalsFor,
            goalsAgainst: normalized.data.goalsAgainst,
            points:       normalized.data.points,
            form:         normalized.data.form,
            zone:         normalized.data.zone,
          });
        } catch { /* skip bad entry */ }
      }

      if (entries.length) {
        const { ok } = await standingsService.upsertMany(entries);
        total += ok;
        // Invalidate cache for this league
        await leaguesCache.invalidateLeague(league.name);
      }

    // Rate limit protection
    await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      logger.error({ err, leagueId: league.id, name: league.name }, 'Failed to sync standings');
      failed++;
    }
  }

  logger.info({ total, failed }, 'standing-sync complete');
}

export function createStandingSyncWorker(): Worker {
  const worker = new Worker(
    'standing-sync',
    async (job) => {
      logger.debug({ jobId: job.id }, 'Processing standing-sync job');
      await syncStandings();
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
      removeOnComplete: { count: QUEUE_COMPLETED_JOBS_RETAIN },
      removeOnFail:     { count: QUEUE_FAILED_JOBS_RETAIN },
    },
  );
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'standing-sync job failed'));
  worker.on('error', (err) => logger.error({ err }, 'standing-sync worker error'));
  return worker;
}
