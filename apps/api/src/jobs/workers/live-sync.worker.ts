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

              // Resolve player ID from externalPlayerId
              let playerId: string | null = null;
              if (ev.externalPlayerId) {
                const playerRows = await db.execute(sql`
                  SELECT id FROM players WHERE provider_ref->>'apiFootball' = ${ev.externalPlayerId} LIMIT 1
                `);
                playerId = (playerRows.rows as any[])[0]?.id ?? null;
              }
              const metaJson = JSON.stringify({ playerName: ev.playerName ?? null });
              await db.execute(sql`
                INSERT INTO match_events (id, match_id, team_id, player_id, event_type, minute, minute_extra, detail, meta)
                VALUES (gen_random_uuid(), ${matchId}, ${teamId}, ${playerId},
                        ${ev.eventType as string}, ${ev.minute}, ${ev.minuteExtra ?? 0},
                        ${ev.detail ?? null}, ${metaJson}::jsonb)
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

  // Fix stale LIVE matches that are no longer in live feed
  await db.execute(sql`UPDATE matches SET status = 'FINISHED', updated_at = NOW() WHERE status IN ('LIVE_1H','LIVE_2H','HALF_TIME','EXTRA_TIME') AND updated_at < NOW() - INTERVAL '10 minutes'`);
  // Backfill events for recently finished matches with no events yet
  const recentFinished = await db.execute(sql`
    SELECT id, provider_ref->>'apiFootball' as ext_id
    FROM matches
    WHERE status = 'FINISHED'
    AND kickoff_at > NOW() - INTERVAL '2 hours'
    AND NOT EXISTS (SELECT 1 FROM match_events WHERE match_id = matches.id)
    LIMIT 10
  `);
  for (const m of (recentFinished.rows as any[])) {
    try {
      const evs = await apiFootballAdapter.getFixtureEvents(m.ext_id);
      for (const ev of evs) {
        const tr = await db.execute(sql`SELECT id FROM teams WHERE provider_ref->>'apiFootball' = ${ev.externalTeamId} LIMIT 1`);
        const teamId = (tr.rows as any[])[0]?.id;
        if (!teamId) continue;
        let playerId: string | null = null;
        if (ev.externalPlayerId) {
          const pr = await db.execute(sql`SELECT id FROM players WHERE provider_ref->>'apiFootball' = ${ev.externalPlayerId} LIMIT 1`);
          playerId = (pr.rows as any[])[0]?.id ?? null;
        }
        const metaJson = JSON.stringify({ playerName: ev.playerName ?? null });
        await db.execute(sql`
          INSERT INTO match_events (id,match_id,team_id,player_id,event_type,minute,minute_extra,detail,meta)
          VALUES (gen_random_uuid(),${m.id},${teamId},${playerId},${ev.eventType as string},${ev.minute},${ev.minuteExtra ?? 0},${ev.detail ?? null},${metaJson}::jsonb)
          ON CONFLICT DO NOTHING
        `);
      }
      logger.info({ extId: m.ext_id }, 'Backfilled events for finished match');
    } catch(e: any) {
      logger.warn({ extId: m.ext_id, err: e.message }, 'Backfill failed');
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
