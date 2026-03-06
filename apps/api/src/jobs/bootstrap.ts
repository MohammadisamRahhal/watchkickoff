/**
 * Worker bootstrap — entry point for the wk-workers PM2 process.
 * Registers all BullMQ workers and starts all schedulers.
 */
import { createLogger } from '@core/logger.js';

const logger = createLogger('bootstrap');

async function main(): Promise<void> {
  logger.info('Starting WatchKickoff worker process');

  // Workers will be registered here in the implementation phase.

  logger.info('All workers started');

  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Worker process shutting down');
    process.exit(0);
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));
}

await main();
