/**
 * players-sync worker — DISABLED in development phase.
 * Players are synced via squad endpoint in sync-season-2025.js
 * This worker does nothing to prevent API quota waste.
 */
import { Worker } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';
import { createLogger } from '@core/logger.js';
import { QUEUE_COMPLETED_JOBS_RETAIN, QUEUE_FAILED_JOBS_RETAIN } from '@config/constants.js';

const logger = createLogger('worker:players-sync');

export function createPlayersSyncWorker(): Worker {
  const worker = new Worker(
    'players-sync',
    async (job) => {
      logger.info({ jobId: job.id }, 'players-sync skipped — disabled in development phase');
    },
    {
      connection: bullmqConnection,
      concurrency: 1,
      removeOnComplete: { count: QUEUE_COMPLETED_JOBS_RETAIN },
      removeOnFail:     { count: QUEUE_FAILED_JOBS_RETAIN },
    },
  );
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'players-sync job failed'));
  worker.on('error',  (err) => logger.error({ err }, 'players-sync worker error'));
  return worker;
}
