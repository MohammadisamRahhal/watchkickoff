import { redis } from '@infrastructure/redis/client.js';
import { TTL } from '@infrastructure/redis/ttl.js';
import { createLogger } from '@core/logger.js';
const logger = createLogger('players-cache');
export const playersCache = { _logger: logger };
