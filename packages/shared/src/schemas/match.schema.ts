import { z } from 'zod';
import type { MatchStatus } from '../constants/match-status.js';
import { TeamSummarySchema } from './team.schema.js';
import { LeagueSummarySchema } from './league.schema.js';
import { MatchEventSchema } from './event.schema.js';

// Mirror the MATCH_STATUS const as a Zod enum for runtime validation.
export const MatchStatusSchema = z.enum([
  'SCHEDULED', 'PRE_MATCH', 'LIVE_1H', 'HALF_TIME',
  'LIVE_2H', 'EXTRA_TIME', 'PENALTIES', 'FINISHED',
  'POSTPONED', 'CANCELLED', 'SUSPENDED', 'AWARDED',
]) satisfies z.ZodType<MatchStatus>;

export const MatchSchema = z.object({
  id:           z.string().uuid(),
  slug:         z.string().min(1).max(300),
  leagueId:     z.string().uuid(),
  homeTeamId:   z.string().uuid(),
  awayTeamId:   z.string().uuid(),
  kickoffAt:    z.coerce.date().nullable(),
  status:       MatchStatusSchema,
  homeScore:    z.number().int().min(0),
  awayScore:    z.number().int().min(0),
  homeScoreHt:  z.number().int().min(0).nullable(),
  awayScoreHt:  z.number().int().min(0).nullable(),
  minute:       z.number().int().min(0).max(130).nullable(),
  minuteExtra:  z.number().int().min(0).max(30).nullable(),
  season:       z.string().min(4).max(10),
  round:        z.string().max(50).nullable(),
  venue:        z.string().max(200).nullable(),
  createdAt:    z.coerce.date(),
  updatedAt:    z.coerce.date(),
});

/** Full match response including related entities — used in API responses. */
export const MatchDetailSchema = MatchSchema.extend({
  league:    LeagueSummarySchema,
  homeTeam:  TeamSummarySchema,
  awayTeam:  TeamSummarySchema,
  events:    z.array(MatchEventSchema),
});

/** Compact match shape used in listings (today's matches, league fixtures). */
export const MatchSummarySchema = MatchSchema.pick({
  id: true, slug: true, leagueId: true,
  homeTeamId: true, awayTeamId: true,
  kickoffAt: true, status: true,
  homeScore: true, awayScore: true,
  minute: true, minuteExtra: true,
  season: true, round: true, venue: true,
}).extend({
  homeTeam: TeamSummarySchema,
  awayTeam: TeamSummarySchema,
});

/** Minimal live-update payload — sent over WebSocket on every poll. */
export const LiveMatchUpdateSchema = z.object({
  matchId:     z.string().uuid(),
  status:      MatchStatusSchema,
  homeScore:   z.number().int().min(0),
  awayScore:   z.number().int().min(0),
  minute:      z.number().int().min(0).max(130).nullable(),
  minuteExtra: z.number().int().min(0).max(30).nullable(),
  updatedAt:   z.coerce.date(),
});

export type Match            = z.infer<typeof MatchSchema>;
export type MatchDetail      = z.infer<typeof MatchDetailSchema>;
export type MatchSummary     = z.infer<typeof MatchSummarySchema>;
export type LiveMatchUpdate  = z.infer<typeof LiveMatchUpdateSchema>;
