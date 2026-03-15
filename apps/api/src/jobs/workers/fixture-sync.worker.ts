/**
 * fixture-sync worker — fetches today fixtures and upserts to DB + Redis.
 */
import { Worker } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';
import { createLogger } from '@core/logger.js';
import { apiFootballAdapter } from '@providers/api-football/adapter.js';
import { matchesQueries } from '@modules/matches/matches.queries.js';
import { matchesCache } from '@modules/matches/matches.cache.js';
import { QUEUE_COMPLETED_JOBS_RETAIN, QUEUE_FAILED_JOBS_RETAIN } from '@config/constants.js';
const logger = createLogger('worker:fixture-sync');
function makeSlug(homeTeamName: string, awayTeamName: string, kickoffAt: Date): string {
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const date = kickoffAt.toISOString().slice(0, 10);
  return `${slugify(homeTeamName)}-vs-${slugify(awayTeamName)}-${date}`;
}
function makeTeamSlug(externalId: string, name: string) {
  return `team-${externalId}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)}`;
}
function makeLeagueSlug(externalId: string, name: string, season: string) {
  return `league-${externalId}-${season}`;
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
        externalId: fx.externalLeagueId, name: leagueName,
        countryCode: leagueCode, season: fx.season, type: 'LEAGUE',
        slug: makeLeagueSlug(fx.externalLeagueId, leagueName, fx.season),
        logo: fx.leagueLogo,
      });
      const homeTeamId = await matchesQueries.upsertTeam({
        externalId: fx.externalHomeTeamId,
        name: fx.homeTeamName ?? fx.externalHomeTeamId,
        countryCode: (fx.homeTeamCountry ?? 'WW').slice(0, 2).toUpperCase(),
        crestUrl: fx.homeTeamCrest,
        slug: makeTeamSlug(fx.externalHomeTeamId, fx.homeTeamName ?? fx.externalHomeTeamId),
      });
      const awayTeamId = await matchesQueries.upsertTeam({
        externalId: fx.externalAwayTeamId,
        name: fx.awayTeamName ?? fx.externalAwayTeamId,
        countryCode: (fx.awayTeamCountry ?? 'WW').slice(0, 2).toUpperCase(),
        crestUrl: fx.awayTeamCrest,
        slug: makeTeamSlug(fx.externalAwayTeamId, fx.awayTeamName ?? fx.externalAwayTeamId),
      });
      await matchesQueries.upsertMatch({
        externalId: fx.externalId, leagueId, homeTeamId, awayTeamId,
        kickoffAt: fx.kickoffAt, status: fx.status,
        homeScore: fx.homeScore, awayScore: fx.awayScore,
        season: fx.season, round: fx.round, venue: fx.venue,
        rawStatus: fx.rawStatus, slug: makeSlug(fx.homeTeamName ?? fx.externalHomeTeamId, fx.awayTeamName ?? fx.externalAwayTeamId, fx.kickoffAt),
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
  const worker = new Worker('fixture-sync', async (job) => {
    logger.debug({ jobId: job.id }, 'Processing fixture-sync job');
    await syncTodayFixtures();
  }, {
    connection: bullmqConnection, concurrency: 1,
    removeOnComplete: { count: QUEUE_COMPLETED_JOBS_RETAIN },
    removeOnFail:     { count: QUEUE_FAILED_JOBS_RETAIN },
  });
  worker.on('failed', (job, err) => { logger.error({ jobId: job?.id, err }, 'fixture-sync job failed'); });
  worker.on('error', (err) => { logger.error({ err }, 'fixture-sync worker error'); });
  return worker;
}
