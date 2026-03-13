/**
 * scorers-sync worker — fetches top scorers per league and upserts to season_stats.
 * Runs every 6 hours alongside standing-sync.
 */
import { Worker } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';
import { createLogger } from '@core/logger.js';
import { apiFootballAdapter } from '@providers/api-football/adapter.js';
import { db } from '@infrastructure/database/client.js';
import { sql } from 'drizzle-orm';
import { QUEUE_COMPLETED_JOBS_RETAIN, QUEUE_FAILED_JOBS_RETAIN } from '@config/constants.js';

const logger = createLogger('worker:scorers-sync');

async function syncTopScorers(): Promise<void> {
  // Get active leagues with external IDs
  const { rows: leagueRows } = await db.execute(sql`
    SELECT id, name, season, provider_ref->>'apiFootball' AS ext_id
    FROM leagues
    WHERE is_active = true
      AND provider_ref->>'apiFootball' IS NOT NULL
      AND provider_ref->>'apiFootball' != ''
    ORDER BY name
  `);

  logger.info({ count: (leagueRows as any[]).length }, 'Syncing top scorers for leagues');

  let upserted = 0; let failed = 0;

  for (const league of leagueRows as any[]) {
    try {
      const scorers = await apiFootballAdapter.getTopScorersDetailed({
        externalLeagueId: league.ext_id,
        season: String(league.season),
      });

      for (const s of scorers) {
        try {
          // Resolve or create player
          let playerIdRes = await db.execute(sql`
            SELECT id FROM players WHERE provider_ref->>'apiFootball' = ${s.externalPlayerId} LIMIT 1
          `);
          let playerId = (playerIdRes.rows as any[])[0]?.id;

          if (!playerId) {
            const slug = `player-${s.externalPlayerId}-${s.playerName.toLowerCase().replace(/[^a-z0-9]/g,'-').slice(0,50)}`;
            await db.execute(sql`
              INSERT INTO players (id, name, slug, provider_ref, status, created_at, updated_at)
              VALUES (gen_random_uuid(), ${s.playerName}, ${slug},
                      ${JSON.stringify({ apiFootball: s.externalPlayerId })}::jsonb,
                      'ACTIVE', NOW(), NOW())
              ON CONFLICT (slug) DO NOTHING
            `);
            playerIdRes = await db.execute(sql`SELECT id FROM players WHERE slug = ${slug} LIMIT 1`);
            playerId = (playerIdRes.rows as any[])[0]?.id;
            if (!playerId) continue;
          }

          // Resolve team
          const teamRes = await db.execute(sql`
            SELECT id FROM teams WHERE provider_ref->>'apiFootball' = ${s.externalTeamId} LIMIT 1
          `);
          const teamId = (teamRes.rows as any[])[0]?.id;
          if (!teamId) continue;

          // Upsert season_stats
          await db.execute(sql`
            INSERT INTO season_stats (
              id, player_id, team_id, league_id, season,
              goals, assists, appearances, minutes_played,
              yellow_cards, red_cards, shots_total, shots_on_target,
              passes_total, pass_accuracy, rating, updated_at
            ) VALUES (
              gen_random_uuid(), ${playerId}, ${teamId}, ${league.id}, ${String(league.season)},
              ${s.goals}, ${s.assists}, ${s.appearances}, ${s.minutesPlayed},
              ${s.yellowCards}, ${s.redCards}, ${s.shotsTotal}, ${s.shotsOnTarget},
              ${s.passesTotal}, ${s.passAccuracy}, ${s.rating}, NOW()
            )
            ON CONFLICT (player_id, league_id, season) DO UPDATE SET
              goals            = EXCLUDED.goals,
              assists          = EXCLUDED.assists,
              appearances      = EXCLUDED.appearances,
              minutes_played   = EXCLUDED.minutes_played,
              yellow_cards     = EXCLUDED.yellow_cards,
              red_cards        = EXCLUDED.red_cards,
              shots_total      = EXCLUDED.shots_total,
              shots_on_target  = EXCLUDED.shots_on_target,
              passes_total     = EXCLUDED.passes_total,
              pass_accuracy    = EXCLUDED.pass_accuracy,
              rating           = EXCLUDED.rating,
              updated_at       = NOW()
          `);
          upserted++;
        } catch (sErr) {
          logger.warn({ sErr, playerId: s.externalPlayerId }, 'Failed to upsert scorer stat');
        }
      }

      // Rate limit: 500ms between leagues
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      logger.error({ err, leagueId: league.id, name: league.name }, 'Failed to fetch top scorers');
      failed++;
    }
  }

  logger.info({ upserted, failed }, 'scorers-sync complete');
}

export function createScorersSyncWorker(): Worker {
  const worker = new Worker(
    'scorers-sync',
    async (job) => {
      logger.debug({ jobId: job.id }, 'Processing scorers-sync job');
      await syncTopScorers();
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
      lockDuration: 300000,
      lockRenewTime: 60000,
      removeOnComplete: { count: QUEUE_COMPLETED_JOBS_RETAIN },
      removeOnFail:     { count: QUEUE_FAILED_JOBS_RETAIN },
    },
  );
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'scorers-sync job failed'));
  worker.on('error', (err) => logger.error({ err }, 'scorers-sync worker error'));
  return worker;
}
