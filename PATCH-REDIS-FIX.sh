#!/bin/bash
# Run this from the project root to apply the Redis import fix.
# This replaces the two Redis infrastructure files with correct content.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_SRC="$SCRIPT_DIR/apps/api/src/infrastructure/redis"

echo "Patching $API_SRC/client.ts ..."
cat > "$API_SRC/client.ts" << 'EOF'
import { Redis } from 'ioredis';
import { config } from '@config/env.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('redis');

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

export function getRedisClient(): Redis { return initClient(); }
export const redis = initClient();

export async function closeRedisClient(): Promise<void> {
  if (_client !== null) { await _client.quit(); _client = null; }
  logger.info('Redis cache client closed');
}
EOF

echo "Patching $API_SRC/pubsub.ts ..."
cat > "$API_SRC/pubsub.ts" << 'EOF'
import { Redis } from 'ioredis';
import { config } from '@config/env.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('redis-pubsub');

function createPubSubClient(role: 'publisher' | 'subscriber'): Redis {
  const client = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
      const delay = Math.min(1000 * Math.pow(2, times), 30_000);
      logger.warn({ role, attempt: times, delayMs: delay }, 'Pub/Sub client reconnecting');
      return delay;
    },
  });
  client.on('connect',    () => logger.info({ role }, 'Pub/Sub client connected'));
  client.on('error', (err) => logger.error({ role, err }, 'Pub/Sub client error'));
  client.on('close',      () => logger.warn({ role }, 'Pub/Sub client closed'));
  return client;
}

let _publisher:  Redis | null = null;
let _subscriber: Redis | null = null;

export function getPubSubPublisher(): Redis {
  if (_publisher === null) _publisher = createPubSubClient('publisher');
  return _publisher;
}
export function getPubSubSubscriber(): Redis {
  if (_subscriber === null) _subscriber = createPubSubClient('subscriber');
  return _subscriber;
}
export async function closePubSubClients(): Promise<void> {
  const tasks: Promise<'OK'>[] = [];
  if (_publisher  !== null) tasks.push(_publisher.quit());
  if (_subscriber !== null) tasks.push(_subscriber.quit());
  await Promise.all(tasks);
  _publisher  = null;
  _subscriber = null;
  logger.info('Pub/Sub clients closed');
}
EOF

echo ""
echo "Patch applied. Now run:"
echo "  rm -rf node_modules package-lock.json"
echo "  npm install"
echo "  npm run build"
