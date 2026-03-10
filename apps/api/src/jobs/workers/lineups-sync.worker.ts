/**
 * lineups-sync worker — fetches lineups for finished/live matches and upserts to DB.
 * Triggers after fixture-sync. Requires players to exist in DB first.
 */
import { Worker } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';
import { createLogger } from '@core/logger.js';
import { apiFootballAdapter } from '@providers/api-football/adapter.js';
import { db } from '@infrastructure/database/client.js';
import { sql } from 'drizzle-orm';
import { QUEUE_COMPLETED_JOBS_RETAIN, QUEUE_FAILED_JOBS_RETAIN } from '@config/constants.js';

const logger = createLogger('worker:lineups-sync');

async function syncLineups(): Promise<void> {
  // Get today's matches that are LIVE or FINISHED and have no lineups yet
  const { rows: matchRows } = await db.execute(sql`
    SELECT m.id, m.provider_ref->>'apiFootball' AS ext_id, m.status
    FROM matches m
    WHERE m.status IN ('LIVE_1H','LIVE_2H','HALF_TIME','EXTRA_TIME','PENALTIES','FINISHED')
      AND m.kickoff_at >= NOW() - INTERVAL '2 days'
      AND NOT EXISTS (
        SELECT 1 FROM match_lineups ml WHERE ml.match_id = m.id
      )
    ORDER BY m.kickoff_at DESC
    LIMIT 50
  `);

  logger.info({ count: (matchRows as any[]).length }, 'Matches needing lineups');

  let upserted = 0; let failed = 0;

  for (const match of matchRows as any[]) {
    if (!match.ext_id) continue;
    try {
      const lineupEntries = await apiFootballAdapter.getFixtureLineups(match.ext_id);

      for (const entry of lineupEntries) {
        try {
          // Resolve team internal ID
          const teamRes = await db.execute(sql`
            SELECT id FROM teams WHERE provider_ref->>'apiFootball' = ${entry.externalTeamId} LIMIT 1
          `);
          const teamId = (teamRes.rows as any[])[0]?.id;
          if (!teamId) continue;

          // Resolve player — may not exist yet, skip if missing
          const playerRes = await db.execute(sql`
            SELECT id FROM players WHERE provider_ref->>'apiFootball' = ${entry.externalPlayerId} LIMIT 1
          `);
          const playerId = (playerRes.rows as any[])[0]?.id;
          if (!playerId) {
            // Auto-create minimal player record so lineup can be saved
            const slug = `player-${entry.externalPlayerId}-${entry.playerName.toLowerCase().replace(/[^a-z0-9]/g,'-').slice(0,50)}`;
            await db.execute(sql`
              INSERT INTO players (id, name, slug, current_team_id, provider_ref, status, created_at, updated_at)
              VALUES (gen_random_uuid(), ${entry.playerName}, ${slug}, ${teamId},
                      ${JSON.stringify({ apiFootball: entry.externalPlayerId })}::jsonb,
                      'ACTIVE', NOW(), NOW())
              ON CONFLICT (slug) DO NOTHING
            `);
            const newPlayerRes = await db.execute(sql`
              SELECT id FROM players WHERE slug = ${slug} LIMIT 1
            `);
            const newPlayerId = (newPlayerRes.rows as any[])[0]?.id;
            if (!newPlayerId) continue;

            await db.execute(sql`
              INSERT INTO match_lineups (id, match_id, team_id, player_id, shirt_number, position_code, formation_slot, is_starter, is_captain)
              VALUES (gen_random_uuid(), ${match.id}, ${teamId}, ${newPlayerId},
                      ${entry.shirtNumber}, ${entry.positionCode}, ${entry.formationSlot},
                      ${entry.isStarter}, ${entry.isCaptain})
              ON CONFLICT (match_id, team_id, player_id) DO UPDATE SET
                shirt_number   = EXCLUDED.shirt_number,
                position_code  = EXCLUDED.position_code,
                is_starter     = EXCLUDED.is_starter,
                is_captain     = EXCLUDED.is_captain
            `);
          } else {
            await db.execute(sql`
              INSERT INTO match_lineups (id, match_id, team_id, player_id, shirt_number, position_code, formation_slot, is_starter, is_captain)
              VALUES (gen_random_uuid(), ${match.id}, ${teamId}, ${playerId},
                      ${entry.shirtNumber}, ${entry.positionCode}, ${entry.formationSlot},
                      ${entry.isStarter}, ${entry.isCaptain})
              ON CONFLICT (match_id, team_id, player_id) DO UPDATE SET
                shirt_number   = EXCLUDED.shirt_number,
                position_code  = EXCLUDED.position_code,
                is_starter     = EXCLUDED.is_starter,
                is_captain     = EXCLUDED.is_captain
            `);
          }
          upserted++;
        } catch (eErr) {
          logger.warn({ eErr, playerId: entry.externalPlayerId }, 'Failed to upsert lineup entry');
        }
      }

      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      logger.error({ err, matchId: match.id, extId: match.ext_id }, 'Failed to fetch lineups');
      failed++;
    }
  }

  logger.info({ upserted, failed }, 'lineups-sync complete');
}

export function createLineupsSyncWorker(): Worker {
  const worker = new Worker(
    'lineups-sync',
    async (job) => {
      logger.debug({ jobId: job.id }, 'Processing lineups-sync job');
      await syncLineups();
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
      removeOnComplete: { count: QUEUE_COMPLETED_JOBS_RETAIN },
      removeOnFail:     { count: QUEUE_FAILED_JOBS_RETAIN },
    },
  );
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'lineups-sync job failed'));
  worker.on('error', (err) => logger.error({ err }, 'lineups-sync worker error'));
  return worker;
}
