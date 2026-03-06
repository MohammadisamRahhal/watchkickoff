/**
 * All possible match lifecycle states.
 * Values are uppercase string literals — safe to store in PostgreSQL enum
 * and send over the wire without transformation.
 */
export const MATCH_STATUS = {
  SCHEDULED:   'SCHEDULED',
  PRE_MATCH:   'PRE_MATCH',
  LIVE_1H:     'LIVE_1H',
  HALF_TIME:   'HALF_TIME',
  LIVE_2H:     'LIVE_2H',
  EXTRA_TIME:  'EXTRA_TIME',
  PENALTIES:   'PENALTIES',
  FINISHED:    'FINISHED',
  POSTPONED:   'POSTPONED',
  CANCELLED:   'CANCELLED',
  SUSPENDED:   'SUSPENDED',
  AWARDED:     'AWARDED',
} as const;

export type MatchStatus = typeof MATCH_STATUS[keyof typeof MATCH_STATUS];

/** Statuses that represent a currently live match. */
export const LIVE_STATUSES = new Set<MatchStatus>([
  MATCH_STATUS.LIVE_1H,
  MATCH_STATUS.HALF_TIME,
  MATCH_STATUS.LIVE_2H,
  MATCH_STATUS.EXTRA_TIME,
  MATCH_STATUS.PENALTIES,
]);

/** Statuses that indicate the match is over and no further updates expected. */
export const TERMINAL_STATUSES = new Set<MatchStatus>([
  MATCH_STATUS.FINISHED,
  MATCH_STATUS.POSTPONED,
  MATCH_STATUS.CANCELLED,
  MATCH_STATUS.AWARDED,
]);

/** Whether a given status represents an active live match. */
export function isLiveStatus(status: MatchStatus): boolean {
  return LIVE_STATUSES.has(status);
}

/** Whether a given status means the match will not produce further events. */
export function isTerminalStatus(status: MatchStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
