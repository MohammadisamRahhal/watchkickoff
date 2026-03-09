/**
 * Matches service — business logic layer.
 */
import { matchesQueries } from './matches.queries.js';
import { matchesCache }   from './matches.cache.js';
import { createLogger }   from '@core/logger.js';
import type { MatchResponse, MatchEventResponse, MatchWithRelations } from './matches.types.js';

const logger = createLogger('matches-service');

function formatMatch(row: MatchWithRelations): MatchResponse {
  return {
    id:        row.id,
    slug:      row.slug,
    status:    row.status,
    minute:    row.minute ?? null,
    kickoffAt: row.kickoffAt ? new Date(row.kickoffAt).toISOString() : null,
    homeTeam:  { id: row.homeTeam.id, name: row.homeTeam.name, crestUrl: row.homeTeam.crestUrl ?? null, slug: row.homeTeam.slug },
    awayTeam:  { id: row.awayTeam.id, name: row.awayTeam.name, crestUrl: row.awayTeam.crestUrl ?? null, slug: row.awayTeam.slug },
    score:     { home: row.score?.home ?? 0, away: row.score?.away ?? 0, homeHt: row.score?.homeHt ?? null, awayHt: row.score?.awayHt ?? null },
    league:    { id: row.league.id, name: row.league.name, countryCode: row.league.countryCode, slug: row.league.slug },
    leagueName:        row.league.name,
    leagueCountryCode: row.league.countryCode,
    leagueSlug:        row.league.slug,
    venue:     row.venue ?? null,
    round:     row.round ?? null,
  };
}

export const matchesService = {
  async getTodayMatches(): Promise<MatchResponse[]> {
    const today = new Date().toISOString().slice(0, 10);
    const cached = await matchesCache.getTodayMatches(today);
    if (cached) { logger.debug('getTodayMatches: cache hit'); return cached; }
    const rows = await matchesQueries.findTodayMatches();
    const result = rows.map(formatMatch);
    await matchesCache.setTodayMatches(today, result);
    return result;
  },

  async getLiveMatches(): Promise<MatchResponse[]> {
    const cached = await matchesCache.getLiveMatches();
    if (cached) { logger.debug('getLiveMatches: cache hit'); return cached; }
    const rows = await matchesQueries.findLiveMatches();
    const result = rows.map(formatMatch);
    await matchesCache.setLiveMatches(result);
    return result;
  },

  async getMatchBySlug(slug: string): Promise<MatchResponse | null> {
    const rows = await matchesQueries.findBySlug(slug);
    if (!rows) return null;
    return formatMatch(rows);
  },

  async getMatchById(id: string): Promise<MatchResponse | null> {
    const cached = await matchesCache.getMatch(id);
    if (cached) { logger.debug({ id }, 'getMatchById: cache hit'); return cached; }
    const row = await matchesQueries.findById(id);
    if (!row) return null;
    const result = formatMatch(row);
    await matchesCache.setMatch(id, result);
    return result;
  },

  async getMatchEvents(matchId: string): Promise<MatchEventResponse[]> {
    const rows = await matchesQueries.findEventsByMatchId(matchId);
    return rows.map(r => ({
      id:          r.id,
      eventType:   r.eventType,
      minute:      r.minute,
      minuteExtra: r.minuteExtra ?? null,
      teamId:      r.teamId,
      playerId:    r.playerId ?? null,
      detail:      r.detail ?? null,
    }));
  },
};
