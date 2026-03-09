/**
 * Matches module — internal TypeScript types.
 */
import type { InferSelectModel } from 'drizzle-orm';
import type { matches, teams, leagues, matchEvents } from '@infrastructure/database/schema.js';

export type MatchRow       = InferSelectModel<typeof matches>;
export type TeamRow        = InferSelectModel<typeof teams>;
export type LeagueRow      = InferSelectModel<typeof leagues>;
export type MatchEventRow  = InferSelectModel<typeof matchEvents>;

export interface MatchWithRelations {
  id:        string;
  slug:      string;
  status:    string;
  minute:    number | null;
  kickoffAt: Date | string;
  season:    string;
  round:     string | null;
  venue:     string | null;
  score:     { home: number; away: number; homeHt: number | null; awayHt: number | null };
  homeTeam:  { id: string; name: string; crestUrl: string | null; slug: string };
  awayTeam:  { id: string; name: string; crestUrl: string | null; slug: string };
  league:    { id: string; name: string; countryCode: string; slug: string };
}

export interface MatchResponse {
  id:         string;
  slug:       string;
  status:     string;
  minute:     number | null;
  kickoffAt:  string | null;
  homeTeam:   { id: string; name: string; crestUrl: string | null; slug: string };
  awayTeam:   { id: string; name: string; crestUrl: string | null; slug: string };
  score:      { home: number; away: number; homeHt: number | null; awayHt: number | null };
  league:     { id: string; name: string; countryCode: string; slug: string };
  venue:             string | null;
  round:             string | null;
  leagueName:        string;
  leagueCountryCode: string;
  leagueSlug:        string;
}

export interface MatchEventResponse {
  id:          string;
  eventType:   string;
  minute:      number;
  minuteExtra: number | null;
  teamId:      string;
  playerId:    string | null;
  detail:      string | null;
}
