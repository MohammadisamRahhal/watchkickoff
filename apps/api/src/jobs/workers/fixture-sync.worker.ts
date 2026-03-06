/**
 * fixture-sync worker — BullMQ job processor.
 * Full implementation in subsequent phases.
 */
import { Worker } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';
import { createLogger } from '@core/logger.js';
import {
  QUEUE_COMPLETED_JOBS_RETAIN,
  QUEUE_FAILED_JOBS_RETAIN,
} from '@config/constants.js';

const logger = createLogger('worker:fixture-sync');

export function createFixtureSyncWorker(): Worker {
  const worker = new Worker(
    'fixture-sync',
    async (job) => {
      logger.debug({ jobId: job.id, data: job.data }, 'Processing job');
      // Implementation in subsequent phases
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
      removeOnComplete: { count: QUEUE_COMPLETED_JOBS_RETAIN },
      removeOnFail:     { count: QUEUE_FAILED_JOBS_RETAIN },
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'fixture-sync job failed');
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'fixture-sync worker error');
  });

  return worker;
}
