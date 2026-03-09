import { teamsQueries } from './teams.queries.js';
import { teamsCache }   from './teams.cache.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('teams-service');

export const teamsService = {
  _logger: logger,

  async getTeamBySlug(slug: string) {
    const cached = await teamsCache.getTeam(slug);
    if (cached) return cached;
    const row = await teamsQueries.findBySlug(slug);
    if (!row) return null;
    const result = {
      id: row.id, name: row.name, slug: row.slug,
      shortName: row.shortName ?? null, crestUrl: row.crestUrl ?? null,
      countryCode: row.countryCode, stadiumName: row.stadiumName ?? null,
      foundedYear: row.foundedYear ?? null,
    };
    await teamsCache.setTeam(slug, result);
    return result;
  },

  async getTeamMatches(teamId: string) {
    const rows = await teamsQueries.findMatchesByTeamId(teamId);
    return rows.map(m => ({
      id: m.id, slug: m.slug, status: m.status, minute: m.minute ?? null,
      kickoffAt: new Date(m.kickoffAt).toISOString(),
      homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId, leagueId: m.leagueId,
      homeScore: m.score.home, awayScore: m.score.away,
      homeScoreHt: m.score.homeHt ?? null, awayScoreHt: m.score.awayHt ?? null,
      season: m.season, round: m.round ?? null, venue: m.venue ?? null,
      minuteExtra: null,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, slug: m.homeTeam.slug, shortName: null, crestUrl: m.homeTeam.crestUrl ?? null, countryCode: 'WW' },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, slug: m.awayTeam.slug, shortName: null, crestUrl: m.awayTeam.crestUrl ?? null, countryCode: 'WW' },
    }));
  },

  async getTeamStandings(teamId: string) {
    return teamsQueries.findStandingByTeamId(teamId);
  },

  async getTeamSquad(teamId: string) {
    return teamsQueries.findSquadByTeamId(teamId);
  },
};
