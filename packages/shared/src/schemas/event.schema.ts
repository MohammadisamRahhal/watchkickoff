import { z } from 'zod';
import type { EventType } from '../constants/event-type';

// Mirror the EVENT_TYPE const as a Zod enum for runtime validation.
export const EventTypeSchema = z.enum([
  'GOAL', 'OWN_GOAL', 'YELLOW', 'SECOND_YELLOW', 'RED',
  'SUB_IN', 'SUB_OUT', 'VAR', 'PENALTY_SCORED', 'PENALTY_MISSED',
]) satisfies z.ZodType<EventType>;

export const MatchEventSchema = z.object({
  id:             z.string().uuid(),
  matchId:        z.string().uuid(),
  teamId:         z.string().uuid(),
  playerId:       z.string().uuid().nullable(),
  assistPlayerId: z.string().uuid().nullable(),
  eventType:      EventTypeSchema,
  minute:         z.number().int().min(1).max(130),
  minuteExtra:    z.number().int().min(0).max(30),
  detail:         z.string().max(100).nullable(),
  meta:           z.record(z.unknown()),
  createdAt:      z.coerce.date(),
});

export type MatchEvent = z.infer<typeof MatchEventSchema>;
