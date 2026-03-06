/**
 * Non-secret application constants.
 * These are fixed values that never change between environments.
 * For environment-dependent values, use config/env.ts.
 */

/** Maximum number of matches to return in a single listing response. */
export const MAX_MATCHES_PER_PAGE = 50;

/** Maximum number of standings rows to return. */
export const MAX_STANDINGS_ROWS = 40;

/** Maximum number of search results to return. */
export const MAX_SEARCH_RESULTS = 20;

/** Number of minutes before kickoff at which a match enters PRE_MATCH state. */
export const PRE_MATCH_WINDOW_MINUTES = 60;

/** Maximum number of past completed jobs to retain per BullMQ queue. */
export const BULL_COMPLETED_JOB_RETENTION = 100;
/** Alias used by worker files. */
export const QUEUE_COMPLETED_JOBS_RETAIN = BULL_COMPLETED_JOB_RETENTION;

/** Maximum number of failed jobs to retain per BullMQ queue. */
export const BULL_FAILED_JOB_RETENTION = 500;
/** Alias used by worker files. */
export const QUEUE_FAILED_JOBS_RETAIN = BULL_FAILED_JOB_RETENTION;

/** Maximum job retry attempts before a job is moved to the failed set. */
export const JOB_MAX_ATTEMPTS = 5;

/**
 * API quota warning threshold — log WARN when daily usage reaches this fraction.
 * 0.80 = warn at 80% of daily limit.
 */
export const API_QUOTA_WARN_THRESHOLD = 0.80;

/**
 * API quota critical threshold — log ERROR when daily usage reaches this fraction.
 * 0.95 = critical at 95% of daily limit.
 */
export const API_QUOTA_CRITICAL_THRESHOLD = 0.95;

/** BullMQ queue names — used as string keys throughout the codebase. */
export const QUEUE_NAMES = {
  LIVE_SYNC:    'live-sync',
  FIXTURE_SYNC: 'fixture-sync',
  STANDING_SYNC:'standing-sync',
  FANOUT:       'fanout',
  REVALIDATION: 'revalidation',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
