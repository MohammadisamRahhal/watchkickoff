/**
 * All TypeScript types are derived from Zod schemas via z.infer.
 * This file re-exports them from schema files for convenience.
 * Do not declare types here manually — add to the relevant schema file.
 *
 * NOTE: MatchStatus and EventType are NOT re-exported here.
 * They are already exported (as both value and type) via constants/index.ts,
 * which flows through src/index.ts as `export * from './constants/index'`.
 * Duplicating them here as `export type` causes TS2305 in consumers.
 */
export type {
  League,
  LeagueSummary,
  LeagueType,
} from '../schemas/league.schema';

export type {
  Team,
  TeamSummary,
} from '../schemas/team.schema';

export type {
  Player,
  PlayerSummary,
  PlayerPosition,
  FootType,
  PlayerStatus,
} from '../schemas/player.schema';

export type {
  MatchEvent,
} from '../schemas/event.schema';

export type {
  Match,
  MatchDetail,
  MatchSummary,
  LiveMatchUpdate,
} from '../schemas/match.schema';

export type {
  StandingRow,
  StandingZone,
} from '../schemas/standing.schema';
