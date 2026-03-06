/**
 * Matches service — business logic layer.
 */
import { matchesQueries } from './matches.queries.js';
import { matchesCache }   from './matches.cache.js';
import { createLogger }   from '@core/logger.js';
import type { MatchResponse, MatchEventResponse, MatchWithRelations } from './matches.types.js';

const logger = createLogger('matches-service');

function formatMatch(row: MatchWithRelations): MatchResponse {
  const { match, homeTeam, league } = row;
  return {
    id:        match.id,
    slug:      match.slug,
    status:    match.status,
    minute:    match.minute ?? null,
    kickoffAt: match.kickoffAt.toISOString(),
    homeTeam:  { id: homeTeam.id, name: homeTeam.name, crestUrl: homeTeam.crestUrl ?? null, slug: homeTeam.slug },
    awayTeam:  { id: match.awayTeamId, name: match.awayTeamId, crestUrl: null, slug: match.awayTeamId },
    score:     { home: match.homeScore ?? 0, away: match.awayScore ?? 0, homeHt: match.homeScoreHt ?? null, awayHt: match.awayScoreHt ?? null },
    league:    { id: league.id, name: league.name, countryCode: league.countryCode, slug: league.slug },
    venue:     match.venue ?? null,
    round:     match.round ?? null,
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
