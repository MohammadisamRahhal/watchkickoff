/**
 * Standings service — business logic layer.
 */
import { standingsQueries } from './standings.queries.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('standings-service');

export const standingsService = {
  _logger: logger,

  async getByLeague(leagueId: string, season: string) {
    return standingsQueries.findByLeagueId(leagueId, season);
  },

  async upsertMany(entries: Array<{
    leagueId: string; teamId: string; season: string;
    position: number; played: number; wins: number; draws: number; losses: number;
    goalsFor: number; goalsAgainst: number; points: number;
    form: string | null; zone: string;
  }>) {
    let ok = 0; let fail = 0;
    for (const entry of entries) {
      try {
        await standingsQueries.upsertStanding(entry);
        ok++;
      } catch (err) {
        logger.error({ err, entry }, 'Failed to upsert standing');
        fail++;
      }
    }
    logger.info({ ok, fail }, 'upsertMany standings done');
    return { ok, fail };
  },
};
