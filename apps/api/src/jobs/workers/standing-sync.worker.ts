/**
 * standing-sync worker — 8 major leagues ONLY.
 */
import { Worker } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';
import { createLogger } from '@core/logger.js';
import { footballApiGet } from '@infrastructure/http/football-api.client.js';
import { db } from '@infrastructure/database/client.js';
import { sql } from 'drizzle-orm';
import { standingsService } from '@modules/standings/standings.service.js';
import { leaguesCache } from '@modules/leagues/leagues.cache.js';
import { normalizeStandingEntry } from '@providers/api-football/normalizer.js';
import { QUEUE_COMPLETED_JOBS_RETAIN, QUEUE_FAILED_JOBS_RETAIN } from '@config/constants.js';

const logger = createLogger('worker:standing-sync');

const MAJOR_IDS = ['2', '3', '39', '61', '78', '135', '140', '307'];

async function syncStandings(): Promise<void> {
  const { rows: leagues } = await db.execute(sql`
    SELECT id, name, season, provider_ref->>'apiFootball' AS ext_id
    FROM leagues
    WHERE provider_ref->>'apiFootball' = ANY(${MAJOR_IDS}::text[])
      AND is_active = true
      AND season = '2025'
    ORDER BY name
  `);

  logger.info({ count: (leagues as any[]).length }, 'Syncing standings for major leagues');

  let total = 0; let failed = 0;
  for (const league of leagues as any[]) {
    try {
      const raw = await footballApiGet(`/standings?league=${league.ext_id}&season=${league.season}`);
      const groups = (raw as any)?.response?.[0]?.league?.standings;
      if (!groups || !Array.isArray(groups)) { await new Promise(r => setTimeout(r, 300)); continue; }
      const allEntries = groups.flat();
      if (!allEntries.length) continue;
      const extIds = allEntries.map((e: any) => String(e.team.id));
      const { rows: teamRows } = await db.execute(sql`
        SELECT id, provider_ref->>'apiFootball' AS ext_id FROM teams
        WHERE provider_ref->>'apiFootball' = ANY(${extIds}::text[])
      `);
      const teamMap = new Map((teamRows as any[]).map(t => [t.ext_id, t.id]));
      const entries: any[] = [];
      for (const entry of allEntries) {
        try {
          const teamId = teamMap.get(String(entry.team.id));
          if (!teamId) continue;
          const normalized = normalizeStandingEntry(entry, String(league.ext_id), String(league.season));
          entries.push({ leagueId: league.id, teamId, season: String(league.season), position: normalized.data.position, played: normalized.data.played, wins: normalized.data.wins, draws: normalized.data.draws, losses: normalized.data.losses, goalsFor: normalized.data.goalsFor, goalsAgainst: normalized.data.goalsAgainst, points: normalized.data.points, form: normalized.data.form, zone: normalized.data.zone });
        } catch {}
      }
      if (entries.length) {
        const { ok } = await standingsService.upsertMany(entries);
        total += ok;
        await leaguesCache.invalidateLeague(league.name);
        logger.info({ league: league.name, entries: ok }, 'Standings updated');
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      logger.error({ err, league: league.name }, 'Failed to sync standings');
      failed++;
    }
  }
  logger.info({ total, failed }, 'standing-sync complete');
}

export function createStandingSyncWorker(): Worker {
  const worker = new Worker('standing-sync', async (job) => {
    logger.debug({ jobId: job.id }, 'Processing standing-sync job');
    await syncStandings();
  }, {
    connection: bullmqConnection, concurrency: 1,
    removeOnComplete: { count: QUEUE_COMPLETED_JOBS_RETAIN },
    removeOnFail:     { count: QUEUE_FAILED_JOBS_RETAIN },
  });
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'standing-sync job failed'));
  worker.on('error',  (err) => logger.error({ err }, 'standing-sync worker error'));
  return worker;
}
