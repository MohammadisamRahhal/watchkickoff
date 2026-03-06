/**
 * API-Football concrete adapter.
 *
 * Implements IFootballProvider by:
 * 1. Calling the centralized HTTP client
 * 2. Validating responses via Zod schemas (schemas.ts)
 * 3. Normalizing provider shapes to internal types (normalizer.ts)
 *
 * THIS IS THE ONLY FILE THAT KNOWS API-FOOTBALL'S RESPONSE SHAPES.
 * No provider-specific field names (e.g. fixture.status, teams.home.id)
 * exist anywhere outside this directory.
 *
 * Business logic implementation will be added in the implementation phase.
 * This scaffold establishes the contract and structure.
 */
import type { IFootballProvider, LiveMatchResult, TopScorer } from '../IFootballProvider.js';
import type { Match, Team, Player, StandingRow } from '@watchkickoff/shared';
import { createLogger } from '@core/logger.js';

const logger = createLogger('api-football-adapter');

export class ApiFootballAdapter implements IFootballProvider {

  async getLiveMatches(): Promise<Match[]> {
    logger.debug('getLiveMatches called');
    // Implementation: Phase 1 business logic — scaffold only.
    throw new Error('Not implemented');
  }

  async getMatch(externalMatchId: string): Promise<LiveMatchResult> {
    logger.debug({ externalMatchId }, 'getMatch called');
    throw new Error('Not implemented');
  }

  async getFixtures(params: {
    externalLeagueId: string;
    season:           string;
    fromDate:         Date;
    toDate:           Date;
  }): Promise<Match[]> {
    logger.debug({ params }, 'getFixtures called');
    throw new Error('Not implemented');
  }

  async getStandings(params: {
    externalLeagueId: string;
    season:           string;
  }): Promise<StandingRow[]> {
    logger.debug({ params }, 'getStandings called');
    throw new Error('Not implemented');
  }

  async getTeam(externalTeamId: string): Promise<Team> {
    logger.debug({ externalTeamId }, 'getTeam called');
    throw new Error('Not implemented');
  }

  async getPlayer(externalPlayerId: string): Promise<Player> {
    logger.debug({ externalPlayerId }, 'getPlayer called');
    throw new Error('Not implemented');
  }

  async getTopScorers(params: {
    externalLeagueId: string;
    season:           string;
  }): Promise<TopScorer[]> {
    logger.debug({ params }, 'getTopScorers called');
    throw new Error('Not implemented');
  }
}
