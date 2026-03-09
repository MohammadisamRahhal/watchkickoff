/**
 * live-sync worker — fetches live fixtures every minute and updates DB + cache.
 */
import { Worker } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';
import { createLogger } from '@core/logger.js';
import { apiFootballAdapter } from '@providers/api-football/adapter.js';
import { matchesQueries } from '@modules/matches/matches.queries.js';
import { matchesCache } from '@modules/matches/matches.cache.js';
import { db } from '@infrastructure/database/client.js';
import { matches } from '@infrastructure/database/schema.js';
import { eq, sql } from 'drizzle-orm';
import { QUEUE_COMPLETED_JOBS_RETAIN, QUEUE_FAILED_JOBS_RETAIN } from '@config/constants.js';

const logger = createLogger('worker:live-sync');

async function syncLiveMatches(): Promise<void> {
  const fixtures = await apiFootballAdapter.getLiveFixtures();

  if (!fixtures.length) {
    logger.debug('No live matches right now');
    // Clear live cache so page shows empty correctly
    await matchesCache.invalidateLiveMatches();
    return;
  }

  logger.info({ count: fixtures.length }, 'Live fixtures received');

  for (const fx of fixtures) {
    try {
      // Update match status, score, minute
      await db.execute(sql`
        UPDATE matches SET
          status       = ${fx.status as string},
          home_score   = ${fx.homeScore},
          away_score   = ${fx.awayScore},
          minute       = ${fx.minute ?? null},
          raw_status   = ${fx.rawStatus ?? null},
          updated_at   = NOW()
        WHERE provider_ref->>'apiFootball' = ${fx.externalId}
      `);

      // Sync events for this live match
      try {
        const events = await apiFootballAdapter.getFixtureEvents(fx.externalId);
        if (events.length) {
          // Get match internal ID
          const matchRows = await db.select({ id: matches.id, homeTeamId: matches.homeTeamId, awayTeamId: matches.awayTeamId })
            .from(matches)
            .where(sql`provider_ref->>'apiFootball' = ${fx.externalId}`)
            .limit(1);

          if (matchRows[0]) {
            const matchId = matchRows[0].id;
            // Delete old events and reinsert (live events change)
            await db.execute(sql`DELETE FROM match_events WHERE match_id = ${matchId}`);

            for (const ev of events) {
              // Resolve team ID
              const teamRows = await db.execute(sql`
                SELECT id FROM teams WHERE provider_ref->>'apiFootball' = ${ev.externalTeamId} LIMIT 1
              `);
              const teamId = (teamRows.rows as any[])[0]?.id;
              if (!teamId) continue;

              await db.execute(sql`
                INSERT INTO match_events (id, match_id, team_id, event_type, minute, minute_extra, detail, meta)
                VALUES (gen_random_uuid(), ${matchId}, ${teamId}, ${ev.eventType as string},
                        ${ev.minute}, ${ev.minuteExtra ?? 0}, ${ev.detail ?? null}, '{}')
                ON CONFLICT DO NOTHING
              `);
            }
          }
        }
      } catch (evErr) {
        logger.warn({ evErr, externalId: fx.externalId }, 'Failed to sync events for live match');
      }

    } catch (err) {
      logger.error({ err, externalId: fx.externalId }, 'Failed to update live match');
    }
  }

  // Invalidate live cache so next request gets fresh data
  await matchesCache.invalidateLiveMatches();
  const today = new Date().toISOString().slice(0, 10);
  await matchesCache.invalidateTodayMatches(today);

  logger.info('live-sync complete');
}

export function createLiveSyncWorker(): Worker {
  const worker = new Worker(
    'live-sync',
    async (job) => {
      logger.debug({ jobId: job.id }, 'Processing live-sync job');
      await syncLiveMatches();
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
      removeOnComplete: { count: QUEUE_COMPLETED_JOBS_RETAIN },
      removeOnFail:     { count: QUEUE_FAILED_JOBS_RETAIN },
    },
  );
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'live-sync job failed'));
  worker.on('error', (err) => logger.error({ err }, 'live-sync worker error'));
  return worker;
}
