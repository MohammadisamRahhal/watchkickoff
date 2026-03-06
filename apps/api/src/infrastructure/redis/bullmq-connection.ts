/**
 * BullMQ connection options — plain RedisOptions object.
 *
 * BullMQ creates and manages its own ioredis connections internally.
 * We supply connection options (host + port), NOT an ioredis instance.
 * This is the official BullMQ v5 pattern and avoids all type conflicts.
 *
 * All queues and workers import `bullmqConnection` from here.
 */
import type { ConnectionOptions } from 'bullmq';
import { config } from '@config/env.js';

export const bullmqConnection: ConnectionOptions = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
};
