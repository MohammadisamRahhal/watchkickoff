/**
 * Redis Pub/Sub clients — dedicated publisher + subscriber instances.
 *
 * Import pattern: `import { Redis } from 'ioredis'` — ioredis v5 exports Redis
 * as a named export. The default import gives the module namespace, not the class.
 */
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

  client.on('connect',     () => logger.info({ role }, 'Pub/Sub client connected'));
  client.on('error',  (err) => logger.error({ role, err }, 'Pub/Sub client error'));
  client.on('close',       () => logger.warn({ role }, 'Pub/Sub client closed'));

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
