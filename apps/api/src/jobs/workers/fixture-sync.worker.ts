/**
 * fixture-sync worker — fetches today fixtures and upserts to DB + Redis.
 */
import { Worker } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';
import { createLogger } from '@core/logger.js';
import { apiFootballAdapter } from '@providers/api-football/adapter.js';
import { matchesQueries } from '@modules/matches/matches.queries.js';
import { matchesCache } from '@modules/matches/matches.cache.js';
import { db } from '@infrastructure/database/client.js';
import { sql } from 'drizzle-orm';
import { QUEUE_COMPLETED_JOBS_RETAIN, QUEUE_FAILED_JOBS_RETAIN } from '@config/constants.js';

const logger = createLogger('worker:fixture-sync');

function makeMatchSlug(homeTeamName: string, awayTeamName: string, kickoffAt: Date): string {
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const date = kickoffAt.toISOString().slice(0, 10);
  return `${slugify(homeTeamName)}-vs-${slugify(awayTeamName)}-${date}`;
}

function makeCleanSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function makeLeagueSlug(externalId: string, name: string, season: string): string {
  // Use clean name-based slug for known leagues, fallback to id-based
  const clean = makeCleanSlug(name);
  return `${clean}-${season}-${parseInt(season) + 1}`;
}

// Find existing team by apiFootball ID, or create with clean slug
async function upsertTeamSmart(externalId: string, name: string, countryCode: string, crestUrl?: string): Promise<string> {
  // First: look up by provider_ref
  const existing = await db.execute(sql`
    SELECT id, slug FROM teams 
    WHERE provider_ref->>'apiFootball' = ${externalId}
    LIMIT 1
  `);
  
  if ((existing.rows as any[]).length > 0) {
    const team = (existing.rows as any[])[0];
    // Update crest if missing
    if (crestUrl) {
      await db.execute(sql`
        UPDATE teams SET crest_url = COALESCE(NULLIF(crest_url,''), ${crestUrl}), updated_at = NOW()
        WHERE id = ${team.id}
      `);
    }
    return team.id;
  }

  // Not found — create with clean slug
  const cleanSlug = makeCleanSlug(name);
  const code = (countryCode || 'WW').slice(0, 2).toUpperCase();
  
  const result = await db.execute(sql`
    INSERT INTO teams (id, name, slug, country_code, crest_url, provider_ref, created_at, updated_at)
    VALUES (gen_random_uuid(), ${name}, ${cleanSlug}, ${code}, ${crestUrl || null},
            jsonb_build_object('apiFootball', ${externalId}::text), NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
      provider_ref = CASE 
        WHEN teams.provider_ref->>'apiFootball' IS NULL 
        THEN jsonb_build_object('apiFootball', ${externalId}::text)
        ELSE teams.provider_ref
      END,
      crest_url = COALESCE(NULLIF(teams.crest_url,''), ${crestUrl || null}),
      updated_at = NOW()
    RETURNING id
  `);
  
  return (result.rows as any[])[0].id;
}

async function syncTodayFixtures(): Promise<void> {
  logger.info('Fetching today fixtures from API-Football');
  const fixtures = await apiFootballAdapter.getTodayFixtures();
  logger.info({ count: fixtures.length }, 'Fixtures received');
  
  for (const fx of fixtures) {
    try {
      const leagueName = fx.leagueName ?? fx.externalLeagueId;
      const leagueCode = (fx.leagueCountryCode ?? 'WW').slice(0, 2).toUpperCase();
      
      const leagueId = await matchesQueries.upsertLeague({
        externalId: fx.externalLeagueId,
        name: leagueName,
        countryCode: leagueCode,
        season: fx.season,
        type: 'LEAGUE',
        slug: makeLeagueSlug(fx.externalLeagueId, leagueName, fx.season),
        logo: fx.leagueLogo,
      });

      const homeTeamId = await upsertTeamSmart(
        fx.externalHomeTeamId,
        fx.homeTeamName ?? fx.externalHomeTeamId,
        fx.homeTeamCountry ?? 'WW',
        fx.homeTeamCrest,
      );

      const awayTeamId = await upsertTeamSmart(
        fx.externalAwayTeamId,
        fx.awayTeamName ?? fx.externalAwayTeamId,
        fx.awayTeamCountry ?? 'WW',
        fx.awayTeamCrest,
      );

      await matchesQueries.upsertMatch({
        externalId: fx.externalId,
        leagueId,
        homeTeamId,
        awayTeamId,
        kickoffAt: fx.kickoffAt,
        status: fx.status,
        homeScore: fx.homeScore,
        awayScore: fx.awayScore,
        season: fx.season,
        round: fx.round,
        venue: fx.venue,
        rawStatus: fx.rawStatus,
        slug: makeMatchSlug(
          fx.homeTeamName ?? fx.externalHomeTeamId,
          fx.awayTeamName ?? fx.externalAwayTeamId,
          fx.kickoffAt,
        ),
      });
    } catch (err) {
      logger.error({ err, externalId: fx.externalId }, 'Failed to upsert fixture');
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  await matchesCache.invalidateTodayMatches(today);
  logger.info('fixture-sync complete');
}

export function createFixtureSyncWorker(): Worker {
  const worker = new Worker(
    'fixture-sync',
    async (job) => {
      logger.debug({ jobId: job.id }, 'Processing fixture-sync job');
      await syncTodayFixtures();
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
      removeOnComplete: { count: QUEUE_COMPLETED_JOBS_RETAIN },
      removeOnFail:     { count: QUEUE_FAILED_JOBS_RETAIN },
    },
  );
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'fixture-sync job failed'));
  worker.on('error', (err) => logger.error({ err }, 'fixture-sync worker error'));
  return worker;
}
