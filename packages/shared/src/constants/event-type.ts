/**
 * All possible match event types.
 * Stored as uppercase string literals in both PostgreSQL and Redis.
 */
export const EVENT_TYPE = {
  GOAL:            'GOAL',
  OWN_GOAL:        'OWN_GOAL',
  YELLOW:          'YELLOW',
  SECOND_YELLOW:   'SECOND_YELLOW',
  RED:             'RED',
  SUB_IN:          'SUB_IN',
  SUB_OUT:         'SUB_OUT',
  VAR:             'VAR',
  PENALTY_SCORED:  'PENALTY_SCORED',
  PENALTY_MISSED:  'PENALTY_MISSED',
} as const;

export type EventType = typeof EVENT_TYPE[keyof typeof EVENT_TYPE];

/** Event types that change the scoreline. */
export const SCORING_EVENTS = new Set<EventType>([
  EVENT_TYPE.GOAL,
  EVENT_TYPE.OWN_GOAL,
  EVENT_TYPE.PENALTY_SCORED,
]);

export function isScoringEvent(type: EventType): boolean {
  return SCORING_EVENTS.has(type);
}
