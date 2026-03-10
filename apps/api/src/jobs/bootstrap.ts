/**
 * Worker bootstrap — entry point for the wk-workers PM2 process.
 */
import { createLogger } from '@core/logger.js';
import { createFixtureSyncWorker }  from './workers/fixture-sync.worker.js';
import { createLiveSyncWorker }     from './workers/live-sync.worker.js';
import { createStandingSyncWorker } from './workers/standing-sync.worker.js';
import { createPlayersSyncWorker }  from './workers/players-sync.worker.js';
import { createLineupsSyncWorker }  from './workers/lineups-sync.worker.js';
import { createScorersSyncWorker }  from './workers/scorers-sync.worker.js';
import { runSeasonSync } from './workers/season-sync.worker.js';
import { Queue } from 'bullmq';
import { bullmqConnection } from '@infrastructure/redis/bullmq-connection.js';

const logger = createLogger('bootstrap');

async function main(): Promise<void> {
  logger.info('Starting WatchKickoff worker process');

  // ── Workers ──────────────────────────────────────────────────
  const fixtureSyncWorker  = createFixtureSyncWorker();
  const liveSyncWorker     = createLiveSyncWorker();
  const standingSyncWorker = createStandingSyncWorker();
  const playersSyncWorker  = createPlayersSyncWorker();
  const lineupsSyncWorker  = createLineupsSyncWorker();
  const scorersSyncWorker  = createScorersSyncWorker();
  logger.info('All workers created');

  // ── Queues ────────────────────────────────────────────────────
  const fixtureSyncQueue  = new Queue('fixture-sync',  { connection: bullmqConnection });
  const liveSyncQueue     = new Queue('live-sync',     { connection: bullmqConnection });
  const standingSyncQueue = new Queue('standing-sync', { connection: bullmqConnection });
  const playersSyncQueue  = new Queue('players-sync',  { connection: bullmqConnection });
  const lineupsSyncQueue  = new Queue('lineups-sync',  { connection: bullmqConnection });
  const scorersSyncQueue  = new Queue('scorers-sync',  { connection: bullmqConnection });

  // fixture-sync — every 30 min
  await fixtureSyncQueue.upsertJobScheduler(
    'fixture-sync-every-30min',
    { every: 30 * 60 * 1000 },
    { name: 'fixture-sync', data: {} },
  );

  // live-sync — every 60 seconds
  await liveSyncQueue.upsertJobScheduler(
    'live-sync-every-60s',
    { every: 60 * 1000 },
    { name: 'live-sync', data: {} },
  );

  // standing-sync — every 6 hours
  await standingSyncQueue.upsertJobScheduler(
    'standing-sync-every-6h',
    { every: 6 * 60 * 60 * 1000 },
    { name: 'standing-sync', data: {} },
  );

  // players-sync — every 24 hours
  await playersSyncQueue.upsertJobScheduler(
    'players-sync-every-24h',
    { every: 24 * 60 * 60 * 1000 },
    { name: 'players-sync', data: {} },
  );

  // lineups-sync — every 10 minutes
  await lineupsSyncQueue.upsertJobScheduler(
    'lineups-sync-every-10min',
    { every: 10 * 60 * 1000 },
    { name: 'lineups-sync', data: {} },
  );

  // scorers-sync — every 6 hours
  await scorersSyncQueue.upsertJobScheduler(
    'scorers-sync-every-6h',
    { every: 6 * 60 * 60 * 1000 },
    { name: 'scorers-sync', data: {} },
  );

  // ── Startup jobs ──────────────────────────────────────────────
  await fixtureSyncQueue.add('fixture-sync-startup', {});
  await standingSyncQueue.add('standing-sync-startup', {});
  await lineupsSyncQueue.add('lineups-sync-startup', {});
  await scorersSyncQueue.add('scorers-sync-startup', {});
  // players-sync: trigger manually via: pm2 trigger wk-workers players-sync
  logger.info('Startup jobs queued (fixture + standing + lineups + scorers)');

  // ── Shutdown ──────────────────────────────────────────────────
  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Worker process shutting down');
    await fixtureSyncWorker.close();
    await liveSyncWorker.close();
    await standingSyncWorker.close();
    await playersSyncWorker.close();
    await lineupsSyncWorker.close();
    await scorersSyncWorker.close();
    await fixtureSyncQueue.close();
    await liveSyncQueue.close();
    await standingSyncQueue.close();
    await playersSyncQueue.close();
    await lineupsSyncQueue.close();
    await scorersSyncQueue.close();
    process.exit(0);
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));
  // Run season sync on startup + every 24h
  runSeasonSync().catch((e: Error) => logger.error({ err: e.message }, 'season-sync startup failed'));
  setInterval(() => {
    runSeasonSync().catch((e: Error) => logger.error({ err: e.message }, 'season-sync scheduled failed'));
  }, 24 * 60 * 60 * 1000);

  logger.info('All workers started ✓');
}

await main();
