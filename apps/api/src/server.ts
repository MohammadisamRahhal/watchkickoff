/**
 * Server entry point.
 */
import { buildApp }             from './app.js';
import { config }               from '@config/env.js';
import { createLogger }         from '@core/logger.js';
import { getDatabaseClient, closeDatabaseClient }
  from '@infrastructure/database/client.js';
import { getRedisClient, closeRedisClient }
  from '@infrastructure/redis/client.js';
import { closePubSubClients }
  from '@infrastructure/redis/pubsub.js';

const logger = createLogger('server');

async function main(): Promise<void> {
  logger.info({ env: config.NODE_ENV }, 'WatchKickoff API starting');

  try {
    getDatabaseClient();
    logger.info('Database client initialized');
  } catch (err) {
    logger.fatal({ err }, 'Failed to initialize database client');
    process.exit(1);
  }

  try {
    getRedisClient();
    logger.info('Redis client initialized');
  } catch (err) {
    logger.fatal({ err }, 'Failed to initialize Redis client');
    process.exit(1);
  }

  const app = await buildApp();

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info({ port: config.PORT }, 'HTTP server listening');
  } catch (err) {
    logger.fatal({ err }, 'Failed to start HTTP server');
    process.exit(1);
  }

  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Shutting down');
    try {
      await app.close();
      await Promise.all([
        closeDatabaseClient(),
        closeRedisClient(),
        closePubSubClients(),
      ]);
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));
}

await main();


