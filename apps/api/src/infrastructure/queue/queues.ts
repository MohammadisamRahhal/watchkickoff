/**
 * BullMQ queue instances — Single Source of Truth.
 *
 * Queues use plain { host, port } connection options.
 * BullMQ manages its own ioredis connections internally.
 */
import { Queue } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';
import { QUEUE_NAMES, BULL_COMPLETED_JOB_RETENTION, BULL_FAILED_JOB_RETENTION } from '@config/constants.js';
import { createLogger } from '@core/logger.js';
import type { LiveSyncJobData, FixtureSyncJobData, StandingSyncJobData, FanoutJobData, RevalidationJobData } from './job-types.js';

const logger = createLogger('queues');

const defaultJobOptions = {
  removeOnComplete: { count: BULL_COMPLETED_JOB_RETENTION },
  removeOnFail:     { count: BULL_FAILED_JOB_RETENTION },
  attempts:         5,
  backoff: {
    type:  'exponential' as const,
    delay: 1_000,
  },
};

export const liveSyncQueue = new Queue<LiveSyncJobData>(QUEUE_NAMES.LIVE_SYNC, {
  connection: bullmqConnection,
  defaultJobOptions,
});

export const fixtureSyncQueue = new Queue<FixtureSyncJobData>(QUEUE_NAMES.FIXTURE_SYNC, {
  connection: bullmqConnection,
  defaultJobOptions,
});

export const standingSyncQueue = new Queue<StandingSyncJobData>(QUEUE_NAMES.STANDING_SYNC, {
  connection: bullmqConnection,
  defaultJobOptions,
});

export const fanoutQueue = new Queue<FanoutJobData>(QUEUE_NAMES.FANOUT, {
  connection: bullmqConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3,
  },
});

export const revalidationQueue = new Queue<RevalidationJobData>(QUEUE_NAMES.REVALIDATION, {
  connection: bullmqConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3,
  },
});

logger.info('BullMQ queues initialised');
