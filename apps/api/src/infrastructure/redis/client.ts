/**
 * ioredis singletons for app cache.
 *
 * Exports:
 *   getRedisClient()  — lazy singleton for general cache use
 *   redis             — eagerly-initialised cache singleton
 *   closeRedisClient()
 *
 * BullMQ queues and workers do NOT use these instances.
 * They use plain { host, port } connection options via bullmq-connection.ts.
 *
 * Import pattern: `import { Redis } from 'ioredis'` — ioredis v5 exports Redis
 * as a named export. The default import gives the module namespace, not the class.
 */
import { Redis } from 'ioredis';
import { config } from '@config/env.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('redis');

// ── App cache client ──────────────────────────────────────────────────────────

let _client: Redis | null = null;

function initClient(): Redis {
  if (_client !== null) return _client;

  _client = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
      const delay = Math.min(1000 * Math.pow(2, times), 30_000);
      logger.warn({ attempt: times, delayMs: delay }, 'Redis reconnecting');
      return delay;
    },
  });

  _client.on('connect',      () => logger.info('Redis connected'));
  _client.on('ready',        () => logger.info('Redis ready'));
  _client.on('error',   (err) => logger.error({ err }, 'Redis error'));
  _client.on('close',        () => logger.warn('Redis connection closed'));
  _client.on('reconnecting', () => logger.warn('Redis reconnecting'));

  return _client;
}

/** Lazily-initialised Redis client factory. */
export function getRedisClient(): Redis {
  return initClient();
}

/**
 * Eagerly-initialised singleton for module cache files.
 * Modules import `{ redis }` directly.
 */
export const redis = initClient();

// ── Shutdown ──────────────────────────────────────────────────────────────────

export async function closeRedisClient(): Promise<void> {
  if (_client !== null) {
    await _client.quit();
    _client = null;
  }
  logger.info('Redis cache client closed');
}
