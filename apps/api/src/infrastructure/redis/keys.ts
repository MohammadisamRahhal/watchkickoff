/**
 * Redis Key Governance — Single Source of Truth.
 * ALL Redis key patterns are defined exclusively in this file.
 */

export const RedisKeys = {
  matchLive:    (matchId: string) => `match:live:${matchId}`,
  matchEvents:  (matchId: string) => `match:events:${matchId}`,
  matchStatic:  (matchId: string) => `match:static:${matchId}`,
  homeToday:    (date: string) => `home:today:${date}`,
  league:       (leagueId: string) => `league:${leagueId}`,
  leagueStandings: (leagueId: string, season: string) =>
    `league:standings:${leagueId}:${season}`,
  leagueFixtures: (leagueId: string, season: string) =>
    `league:fixtures:${leagueId}:${season}`,
  team:         (teamId: string) => `team:${teamId}`,
  player:       (playerId: string) => `player:${playerId}`,

  /** Rate-limit key namespace — both top-level and nested access work. */
  apiDailyCalls:  () => `rl:api:daily:${_todayUtc()}`,
  apiMinuteCalls: () => `rl:api:minute:${_currentMinuteBucket()}`,

  /** Nested rate-limit namespace for callers using RedisKeys.rateLimit.*() */
  rateLimit: {
    apiDailyCalls:  () => `rl:api:daily:${_todayUtc()}`,
    apiMinuteCalls: () => `rl:api:minute:${_currentMinuteBucket()}`,
  },

  cacheLock: (key: string) => `lock:${key}`,

  pubsub: {
    match:    (matchId: string) => `ps:match:${matchId}`,
    homeFeed: () => `ps:home:feed`,
  },
} as const;

function _todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function _currentMinuteBucket(): string {
  return String(Math.floor(Date.now() / 60_000));
}
