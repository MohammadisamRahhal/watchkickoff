/**
 * Worker bootstrap — entry point for the wk-workers PM2 process.
 */
import { createLogger } from '@core/logger.js';
import { createFixtureSyncWorker } from './workers/fixture-sync.worker.js';
import { createLiveSyncWorker } from './workers/live-sync.worker.js';
import { createStandingSyncWorker } from './workers/standing-sync.worker.js';
import { Queue } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';

const logger = createLogger('bootstrap');

async function main(): Promise<void> {
  logger.info('Starting WatchKickoff worker process');

  // ── Workers ──────────────────────────────────────────────────
  const fixtureSyncWorker  = createFixtureSyncWorker();
  const liveSyncWorker     = createLiveSyncWorker();
  const standingSyncWorker = createStandingSyncWorker();
  logger.info('All workers created');

  // ── Queues ────────────────────────────────────────────────────
  const fixtureSyncQueue  = new Queue('fixture-sync',  { connection: bullmqConnection });
  const liveSyncQueue     = new Queue('live-sync',     { connection: bullmqConnection });
  const standingSyncQueue = new Queue('standing-sync', { connection: bullmqConnection });

  // fixture-sync — every 30 min
  await fixtureSyncQueue.upsertJobScheduler(
    'fixture-sync-every-30min',
    { every: 30 * 60 * 1000 },
    { name: 'fixture-sync', data: {} },
  );
  logger.info('fixture-sync scheduler registered (every 30 min)');

  // live-sync — every 60 seconds
  await liveSyncQueue.upsertJobScheduler(
    'live-sync-every-60s',
    { every: 60 * 1000 },
    { name: 'live-sync', data: {} },
  );
  logger.info('live-sync scheduler registered (every 60 sec)');

  // standing-sync — every 6 hours
  await standingSyncQueue.upsertJobScheduler(
    'standing-sync-every-6h',
    { every: 6 * 60 * 60 * 1000 },
    { name: 'standing-sync', data: {} },
  );
  logger.info('standing-sync scheduler registered (every 6 hours)');

  // ── Startup jobs ──────────────────────────────────────────────
  await fixtureSyncQueue.add('fixture-sync-startup', {});
  await standingSyncQueue.add('standing-sync-startup', {});
  logger.info('Startup jobs queued (fixture + standing)');

  // ── Shutdown ──────────────────────────────────────────────────
  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Worker process shutting down');
    await fixtureSyncWorker.close();
    await liveSyncWorker.close();
    await standingSyncWorker.close();
    await fixtureSyncQueue.close();
    await liveSyncQueue.close();
    await standingSyncQueue.close();
    process.exit(0);
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));

  logger.info('All workers started ✓');
}

await main();
