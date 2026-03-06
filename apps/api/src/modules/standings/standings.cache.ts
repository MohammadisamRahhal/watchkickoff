/**
 * Standings cache helpers.
 * All Redis read/write operations for the standings module.
 */
import { redis } from '@infrastructure/redis/client.js';
import { RedisKeys } from '@infrastructure/redis/keys.js';
import { TTL } from '@infrastructure/redis/ttl.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('standings-cache');

// Cache methods implemented in subsequent phases
export const standingsCache = {
  _logger: logger,
  _redis: redis,
  _keys: RedisKeys,
  _ttl: TTL,
};
