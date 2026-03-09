/**
 * IFootballProvider — The provider contract.
 *
 * Also exports normalized intermediate types used by the adapter normalizer.
 * These types represent the provider-agnostic shape returned from normalizer
 * functions before persistence — they are NOT the same as the DB entity types.
 */
import type {
  Match,
  MatchDetail,
  Team,
  Player,
  StandingRow,
} from '@watchkickoff/shared';
import type { MatchStatus, EventType } from '@watchkickoff/shared';

export interface LiveMatchResult {
  match:  Match;
  events: MatchDetail['events'];
}

export interface TopScorer {
  playerId:    string;
  playerName:  string;
  teamId:      string;
  goals:       number;
  assists:     number;
  appearances: number;
}

/** Normalized fixture shape from provider — used before DB upsert. */
export interface ProviderFixture {
  externalId:         string;
  externalLeagueId:   string;
  externalHomeTeamId: string;
  externalAwayTeamId: string;
  leagueName?:        string;
  leagueCountryCode?: string;
  leagueLogo?:        string;
  homeTeamName?:      string;
  homeTeamCrest?:     string;
  homeTeamCountry?:   string;
  awayTeamName?:      string;
  awayTeamCrest?:     string;
  awayTeamCountry?:   string;
  kickoffAt:          Date;
  status:             MatchStatus;
  homeScore:          number;
  awayScore:          number;
  season:             string;
  round?:             string;
  venue?:             string;
  rawStatus:          string;
  minute?:            number | null;
}

/** Normalized event shape from provider — used before DB insert. */
export interface NormalizedEvent {
  externalMatchId:  string;
  externalTeamId:   string;
  externalPlayerId?: string;
  externalAssistId?: string;
  eventType:        EventType;
  minute:           number;
  minuteExtra:      number;
  detail:           string;
}

/** Normalized match stat shape (placeholder for future stat ingestion). */
export interface NormalizedMatchStat {
  externalMatchId: string;
  externalTeamId:  string;
  statType:        string;
  value:           number;
}

export interface IFootballProvider {
  getLiveMatches(): Promise<Match[]>;
  getMatch(externalMatchId: string): Promise<LiveMatchResult>;
  getFixtures(params: {
    externalLeagueId: string;
    season:           string;
    fromDate:         Date;
    toDate:           Date;
  }): Promise<Match[]>;
  getStandings(params: {
    externalLeagueId: string;
    season:           string;
  }): Promise<StandingRow[]>;
  getTeam(externalTeamId: string): Promise<Team>;
  getPlayer(externalPlayerId: string): Promise<Player>;
  getTopScorers(params: {
    externalLeagueId: string;
    season:           string;
  }): Promise<TopScorer[]>;
}
