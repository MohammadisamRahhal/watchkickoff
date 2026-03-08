/**
 * Worker bootstrap — entry point for the wk-workers PM2 process.
 */
import { createLogger } from '@core/logger.js';
import { createFixtureSyncWorker } from './workers/fixture-sync.worker.js';
import { Queue } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';

const logger = createLogger('bootstrap');

async function main(): Promise<void> {
  logger.info('Starting WatchKickoff worker process');

  const fixtureSyncWorker = createFixtureSyncWorker();
  logger.info('fixture-sync worker started');

  const fixtureSyncQueue = new Queue('fixture-sync', { connection: bullmqConnection });
  await fixtureSyncQueue.upsertJobScheduler(
    'fixture-sync-every-5min',
    { every: 30 * 60 * 1000 },
    { name: 'fixture-sync', data: {} }
  );
  logger.info('fixture-sync scheduler registered (every 30 min)');

  await fixtureSyncQueue.add('fixture-sync-startup', {});
  logger.info('fixture-sync startup job queued');

  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Worker process shutting down');
    await fixtureSyncWorker.close();
    await fixtureSyncQueue.close();
    process.exit(0);
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));

  logger.info('All workers started');
}

await main();
