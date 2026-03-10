/**
 * players-sync worker — fetches squad players for all active teams and upserts to DB.
 * Runs once per day (or on-demand). Enables player pages, squad tabs, and scorers.
 */
import { Worker } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';
import { createLogger } from '@core/logger.js';
import { apiFootballAdapter } from '@providers/api-football/adapter.js';
import { db } from '@infrastructure/database/client.js';
import { sql } from 'drizzle-orm';
import { QUEUE_COMPLETED_JOBS_RETAIN, QUEUE_FAILED_JOBS_RETAIN } from '@config/constants.js';

const logger = createLogger('worker:players-sync');

async function syncPlayers(): Promise<void> {
  // Get all teams that have an API-Football external ID
  const { rows: teamRows } = await db.execute(sql`
    SELECT id, name, provider_ref->>'apiFootball' AS ext_id
    FROM teams
    WHERE provider_ref->>'apiFootball' IS NOT NULL
      AND provider_ref->>'apiFootball' != ''
    ORDER BY name
    LIMIT 500
  `);

  const season = String(new Date().getFullYear());
  logger.info({ count: (teamRows as any[]).length, season }, 'Syncing players for teams');

  let upserted = 0; let failed = 0;

  for (const team of teamRows as any[]) {
    try {
      const players = await apiFootballAdapter.getSquadPlayers(team.ext_id, season);

      for (const p of players) {
        try {
          // Resolve current_team_id
          const teamIdResult = await db.execute(sql`
            SELECT id FROM teams WHERE provider_ref->>'apiFootball' = ${team.ext_id} LIMIT 1
          `);
          const currentTeamId = (teamIdResult.rows as any[])[0]?.id ?? null;

          await db.execute(sql`
            INSERT INTO players (id, name, slug, nationality_code, date_of_birth, height_cm, position, current_team_id, provider_ref, status, created_at, updated_at)
            VALUES (
              gen_random_uuid(),
              ${p.name},
              ${p.slug},
              ${p.nationalityCode},
              ${p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0,10) : null},
              ${p.heightCm},
              ${normalizePosition(p.position)},
              ${currentTeamId},
              ${JSON.stringify({ apiFootball: p.externalId })}::jsonb,
              'ACTIVE',
              NOW(), NOW()
            )
            ON CONFLICT (slug) DO UPDATE SET
              name             = EXCLUDED.name,
              nationality_code = EXCLUDED.nationality_code,
              height_cm        = EXCLUDED.height_cm,
              position         = EXCLUDED.position,
              current_team_id  = EXCLUDED.current_team_id,
              updated_at       = NOW()
          `);
          upserted++;
        } catch (pErr) {
          logger.warn({ pErr, playerId: p.externalId }, 'Failed to upsert player');
        }
      }

      // Rate limit: 300ms between teams
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      logger.error({ err, teamId: team.id, teamName: team.name }, 'Failed to fetch squad');
      failed++;
    }
  }

  logger.info({ upserted, failed }, 'players-sync complete');
}

/** Map API-Football position string to our player_position enum */
function normalizePosition(pos: string | null): string | null {
  if (!pos) return null;
  const p = pos.toUpperCase();
  if (p === 'G' || p.includes('GOALKEEPER')) return 'GK';
  if (p === 'D' || p.includes('DEFENDER'))   return 'DEF';
  if (p === 'M' || p.includes('MIDFIELDER')) return 'MID';
  if (p === 'F' || p.includes('ATTACKER') || p.includes('FORWARD')) return 'FWD';
  return null;
}

export function createPlayersSyncWorker(): Worker {
  const worker = new Worker(
    'players-sync',
    async (job) => {
      logger.debug({ jobId: job.id }, 'Processing players-sync job');
      await syncPlayers();
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
      removeOnComplete: { count: QUEUE_COMPLETED_JOBS_RETAIN },
      removeOnFail:     { count: QUEUE_FAILED_JOBS_RETAIN },
    },
  );
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'players-sync job failed'));
  worker.on('error', (err) => logger.error({ err }, 'players-sync worker error'));
  return worker;
}
