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
const BATCH_SIZE = 50;
let leagueOffset = 0;

async function syncStandings(): Promise<void> {
  const { rows: allLeagues } = await db.execute(sql`SELECT id, name, season, provider_ref->>'apiFootball' AS ext_id FROM leagues WHERE is_active = true AND provider_ref->>'apiFootball' IS NOT NULL AND provider_ref->>'apiFootball' != '' ORDER BY name`);
  const totalLeagues = (allLeagues as any[]).length;
  if (totalLeagues === 0) return;
  if (leagueOffset >= totalLeagues) leagueOffset = 0;
  const batch = (allLeagues as any[]).slice(leagueOffset, leagueOffset + BATCH_SIZE);
  leagueOffset += BATCH_SIZE;
  logger.info({ batchSize: batch.length, offset: leagueOffset - BATCH_SIZE, total: totalLeagues }, 'Syncing standings batch');
  let total = 0; let failed = 0;
  for (const league of batch) {
    try {
      const raw = await footballApiGet(`/standings?league=${league.ext_id}&season=${league.season}`);
      const groups = (raw as any)?.response?.[0]?.league?.standings;
      if (!groups || !Array.isArray(groups)) { await new Promise(r => setTimeout(r, 200)); continue; }
      const allEntries = groups.flat();
      if (!allEntries.length) { await new Promise(r => setTimeout(r, 200)); continue; }
      const extIds = allEntries.map((e: any) => String(e.team.id));
      const { rows: teamRows } = await db.execute(sql`SELECT id, provider_ref->>'apiFootball' AS ext_id FROM teams WHERE provider_ref->>'apiFootball' = ANY(${extIds}::text[])`);
      const teamMap = new Map((teamRows as any[]).map(t => [t.ext_id, t.id]));
      const entries: any[] = [];
      for (const entry of allEntries) {
        try {
          const teamId = teamMap.get(String(entry.team.id));
          if (!teamId) continue;
          const normalized = normalizeStandingEntry(entry, String(league.ext_id), String(league.season));
          entries.push({ leagueId: league.id, teamId, season: String(league.season), position: normalized.data.position, played: normalized.data.played, wins: normalized.data.wins, draws: normalized.data.draws, losses: normalized.data.losses, goalsFor: normalized.data.goalsFor, goalsAgainst: normalized.data.goalsAgainst, points: normalized.data.points, form: normalized.data.form, zone: normalized.data.zone });
        } catch { }
      }
      if (entries.length) {
        const { ok } = await standingsService.upsertMany(entries);
        total += ok;
        await leaguesCache.invalidateLeague(league.name);
      }
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      logger.error({ err, leagueId: league.id, name: league.name }, 'Failed to sync standings');
      failed++;
    }
  }
  logger.info({ total, failed, batchProcessed: batch.length }, 'standing-sync complete');
}

export function createStandingSyncWorker(): Worker {
  const worker = new Worker('standing-sync', async (job) => { await syncStandings(); }, { connection: bullmqConnection, concurrency: 1, lockDuration: 300000, lockRenewTime: 60000, removeOnComplete: { count: QUEUE_COMPLETED_JOBS_RETAIN }, removeOnFail: { count: QUEUE_FAILED_JOBS_RETAIN } });
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'standing-sync job failed'));
  worker.on('error', (err) => logger.error({ err }, 'standing-sync worker error'));
  return worker;
}
