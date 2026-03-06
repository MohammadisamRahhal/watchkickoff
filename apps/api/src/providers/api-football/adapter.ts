/**
 * API-Football concrete adapter — full implementation.
 */
import type { IFootballProvider, LiveMatchResult, TopScorer, ProviderFixture } from '../IFootballProvider.js';
import type { Match, Team, Player, StandingRow } from '@watchkickoff/shared';
import { footballApiGet } from '@infrastructure/http/football-api.client.js';
import { ApiFixturesResponseSchema, ApiEventsResponseSchema } from './schemas.js';
import { normalizeFixture, normalizeEvent } from './normalizer.js';
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
  async getPlayer(_id: string): Promise<Player> { throw new Error('Not implemented'); }
  async getTopScorers(_p: any): Promise<TopScorer[]> { throw new Error('Not implemented'); }
}
export const apiFootballAdapter = new ApiFootballAdapter();
