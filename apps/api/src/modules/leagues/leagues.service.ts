/**
 * Leagues service — business logic layer.
 */
import { leaguesQueries } from './leagues.queries.js';
import { leaguesCache }   from './leagues.cache.js';
import { createLogger }   from '@core/logger.js';
const logger = createLogger('leagues-service');
export const leaguesService = {
  _logger: logger,
  async getAllLeagues() {
    const cached = await leaguesCache.getAll();
    if (cached) return cached;
    const rows = await leaguesQueries.findAll();
    const result = rows.map(r => ({
      id: r.id, name: r.name, slug: r.slug,
      countryCode: r.countryCode ?? r.country_code, season: r.season,
      type: r.type, isActive: r.isActive ?? r.is_active,
      logo: (r as any).logo ?? (() => { try { const p = r.providerRef ?? r.provider_ref; return (typeof p === 'string' ? JSON.parse(p) : p)?.logo ?? null; } catch { return null; } })(),
    }));
    await leaguesCache.setAll(result);
    return result;
  },
  async getLeagueBySlug(slug: string) {
    const cached = await leaguesCache.getLeague(slug);
    if (cached) return cached;
    const row = await leaguesQueries.findBySlug(slug);
    if (!row) return null;
    const result = {
      id: row.id, name: row.name, slug: row.slug,
      countryCode: row.countryCode, season: row.season,
      type: row.type, isActive: row.isActive,
      logo: (row as any).logo ?? (row.providerRef as any)?.logo ?? null,
    };
    await leaguesCache.setLeague(slug, result);
    return result;
  },
  async getLeagueMatches(slug: string, season?: string, round?: string) {
    const rows = await leaguesQueries.findMatchesByLeagueSlug(slug, season, round);
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
  async getLeagueStandings(slug: string) {
    const cached = await leaguesCache.getStandings(slug);
    if (cached) return cached;
    const rows = await leaguesQueries.findStandingsByLeagueSlug(slug);
    await leaguesCache.setStandings(slug, rows);
    return rows;
  },
  async getLeagueRounds(slug: string, season?: string) {
    return leaguesQueries.findRoundsByLeagueSlug(slug, season);
  },
  async getLeagueTopScorers(slug: string) {
    const rows = await leaguesQueries.findTopScorersByLeagueSlug(slug);
    return rows;
  },
};
