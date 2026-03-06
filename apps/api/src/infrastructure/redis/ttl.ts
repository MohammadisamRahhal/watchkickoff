/**
 * Redis TTL Governance — Single Source of Truth.
 * ALL cache TTL values (in seconds) are defined exclusively in this file.
 */
export const TTL = {
  MATCH_LIVE:       20,
  MATCH_EVENTS:     20,
  MATCH_STATIC:    600,
  HOME_TODAY:       60,
  LEAGUE_FIXTURES: 300,
  LEAGUE_STANDINGS:120,
  LEAGUE_PROFILE: 1800,
  TEAM:            900,
  PLAYER:          900,
  CACHE_LOCK:        3,
  /** TTL for the API daily call counter key — 25 hours ensures it expires within a day. */
  API_DAILY_CALLS: 90_000,
} as const;

/** Alias for callers that use RedisTTL instead of TTL. */
export const RedisTTL = TTL;

export type TtlKey = keyof typeof TTL;
