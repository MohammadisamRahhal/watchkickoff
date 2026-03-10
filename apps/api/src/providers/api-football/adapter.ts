/**
 * API-Football concrete adapter — full implementation.
 */
import type { IFootballProvider, LiveMatchResult, TopScorer, ProviderFixture } from '../IFootballProvider.js';
import type { Match, Team, Player, StandingRow } from '@watchkickoff/shared';
import { footballApiGet } from '@infrastructure/http/football-api.client.js';
import { ApiFixturesResponseSchema, ApiEventsResponseSchema, ApiPlayersResponseSchema, ApiLineupsResponseSchema, ApiTopScorersResponseSchema } from './schemas.js';
import { normalizeFixture, normalizeEvent, normalizePlayer, normalizeLineup, normalizeTopScorer } from './normalizer.js';
import { createLogger } from '@core/logger.js';
const logger = createLogger('api-football-adapter');
export class ApiFootballAdapter implements IFootballProvider {
  async getTodayFixtures(): Promise<ProviderFixture[]> {
    const date = new Date().toISOString().slice(0, 10);
    logger.debug({ date }, 'getTodayFixtures');
    const raw = await footballApiGet(`/fixtures?date=${date}`);
    const parsed = ApiFixturesResponseSchema.parse(raw);
    return parsed.response.map(normalizeFixture);
  }
  async getLiveFixtures(): Promise<ProviderFixture[]> {
    logger.debug('getLiveFixtures');
    const raw = await footballApiGet('/fixtures?live=all');
    const parsed = ApiFixturesResponseSchema.parse(raw);
    return parsed.response.map(normalizeFixture);
  }
  async getFixtureEvents(externalFixtureId: string) {
    logger.debug({ externalFixtureId }, 'getFixtureEvents');
    const raw = await footballApiGet(`/fixtures/events?fixture=${externalFixtureId}`);
    const parsed = ApiEventsResponseSchema.parse(raw);
    return parsed.response.map(e => normalizeEvent(e, externalFixtureId));
  }
  async getSquadPlayers(externalTeamId: string, season: string): Promise<import('./normalizer.js').NormalizedPlayer[]> {
    logger.debug({ externalTeamId, season }, 'getSquadPlayers');
    const raw = await footballApiGet(`/players?team=${externalTeamId}&season=${season}&page=1`);
    const parsed = ApiPlayersResponseSchema.parse(raw);
    const results = [...parsed.response];
    // Handle pagination
    const totalPages = (raw as any)?.paging?.total ?? 1;
    for (let page = 2; page <= Math.min(totalPages, 5); page++) {
      const pageRaw = await footballApiGet(`/players?team=${externalTeamId}&season=${season}&page=${page}`);
      const pageParsed = ApiPlayersResponseSchema.parse(pageRaw);
      results.push(...pageParsed.response);
      await new Promise(r => setTimeout(r, 300));
    }
    return results.map(normalizePlayer);
  }

  async getFixtureLineups(externalFixtureId: string): Promise<import('./normalizer.js').NormalizedLineupEntry[]> {
    logger.debug({ externalFixtureId }, 'getFixtureLineups');
    const raw = await footballApiGet(`/fixtures/lineups?fixture=${externalFixtureId}`);
    const parsed = ApiLineupsResponseSchema.parse(raw);
    return parsed.response.flatMap(normalizeLineup);
  }

  async getTopScorersDetailed(params: { externalLeagueId: string; season: string; }): Promise<import('./normalizer.js').NormalizedTopScorer[]> {
    logger.debug({ params }, 'getTopScorersDetailed');
    const raw = await footballApiGet(`/players/topscorers?league=${params.externalLeagueId}&season=${params.season}`);
    const parsed = ApiTopScorersResponseSchema.parse(raw);
    return parsed.response
      .map(normalizeTopScorer)
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }

  async getLiveMatches(): Promise<Match[]> { throw new Error('Use getLiveFixtures()'); }
  async getMatch(_id: string): Promise<LiveMatchResult> { throw new Error('Not implemented'); }
  async getFixtures(params: { externalLeagueId: string; season: string; fromDate: Date; toDate: Date; }): Promise<Match[]> {
    const from = params.fromDate.toISOString().slice(0, 10);
    const to   = params.toDate.toISOString().slice(0, 10);
    const raw  = await footballApiGet(`/fixtures?league=${params.externalLeagueId}&season=${params.season}&from=${from}&to=${to}`);
    const parsed = ApiFixturesResponseSchema.parse(raw);
    return parsed.response.map(normalizeFixture) as unknown as Match[];
  }
  async getStandings(_p: any): Promise<StandingRow[]> { throw new Error('Not implemented'); }
  async getTeam(_id: string): Promise<Team> { throw new Error('Not implemented'); }
  async getPlayer(externalPlayerId: string): Promise<Player> {
    const raw = await footballApiGet(`/players?id=${externalPlayerId}&season=${new Date().getFullYear()}`);
    const parsed = ApiPlayersResponseSchema.parse(raw);
    if (!parsed.response.length) throw new Error(`Player ${externalPlayerId} not found`);
    return normalizePlayer(parsed.response[0]) as unknown as Player;
  }
  async getTopScorers(params: { externalLeagueId: string; season: string; }): Promise<TopScorer[]> {
    logger.debug({ params }, 'getTopScorers');
    const raw = await footballApiGet(`/players/topscorers?league=${params.externalLeagueId}&season=${params.season}`);
    const parsed = ApiTopScorersResponseSchema.parse(raw);
    return parsed.response
      .map(normalizeTopScorer)
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map(s => ({
        playerId:    s.externalPlayerId,
        playerName:  s.playerName,
        teamId:      s.externalTeamId,
        goals:       s.goals,
        assists:     s.assists,
        appearances: s.appearances,
      }));
  }
}
export const apiFootballAdapter = new ApiFootballAdapter();
