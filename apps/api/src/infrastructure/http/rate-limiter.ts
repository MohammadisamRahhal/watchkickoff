/**
 * infrastructure/http/rate-limiter.ts — Token bucket for API-Football quota.
 *
 * Enforces the FOOTBALL_API_DAILY_LIMIT hard cap.
 * All provider HTTP calls MUST call checkAndIncrementQuota() before dispatch.
 * If the quota is exhausted, throws ProviderError — callers must not proceed.
 *
 * Counters are stored in Redis so they survive process restarts.
 */

import { getRedisClient }         from '../redis/client.js';
import { RedisKeys }              from '../redis/keys.js';
import { RedisTTL }               from '../redis/ttl.js';
import { config }                 from '../../config/env.js';
import { createLogger }           from '../../core/logger.js';
import { ProviderError }          from '../../core/errors/app-error.js';
import {
  API_QUOTA_WARN_THRESHOLD,
  API_QUOTA_CRITICAL_THRESHOLD,
} from '../../config/constants.js';

const logger = createLogger('rate-limiter');

const DAILY_LIMIT  = config.FOOTBALL_API_DAILY_LIMIT;
const WARN_AT      = Math.floor(DAILY_LIMIT * API_QUOTA_WARN_THRESHOLD);
const CRITICAL_AT  = Math.floor(DAILY_LIMIT * API_QUOTA_CRITICAL_THRESHOLD);

/**
 * Atomically increments the daily call counter and checks quota.
 * @throws {ProviderError} if the daily quota has been reached
 */
export async function checkAndIncrementQuota(): Promise<void> {
  const redis     = getRedisClient();
  const dailyKey  = RedisKeys.rateLimit.apiDailyCalls();

  const current = await redis.incr(dailyKey);

  // Set TTL only on first call of the day (when counter was 0 before incr)
  if (current === 1) {
    await redis.expire(dailyKey, RedisTTL.API_DAILY_CALLS);
  }

  if (current > DAILY_LIMIT) {
    logger.error(
      { current, limit: DAILY_LIMIT },
      'API daily quota exhausted — all provider calls blocked',
    );
    throw new ProviderError(
      'PROVIDER_RATE_LIMITED',
      `API daily quota of ${DAILY_LIMIT} calls exceeded`,
    );
  }

  if (current >= CRITICAL_AT) {
    logger.error(
      { current, limit: DAILY_LIMIT, pct: Math.round((current / DAILY_LIMIT) * 100) },
      'API quota critical — approaching daily limit',
    );
  } else if (current >= WARN_AT) {
    logger.warn(
      { current, limit: DAILY_LIMIT, pct: Math.round((current / DAILY_LIMIT) * 100) },
      'API quota warning — 80% of daily limit used',
    );
  }
}

/** Returns the current daily call count without incrementing. */
export async function getDailyCallCount(): Promise<number> {
  const redis    = getRedisClient();
  const dailyKey = RedisKeys.rateLimit.apiDailyCalls();
  const value    = await redis.get(dailyKey);
  return value !== null ? parseInt(value, 10) : 0;
}
