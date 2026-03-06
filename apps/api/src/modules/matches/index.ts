/**
 * Matches module registration.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('matches');

export async function registerMatchesModule(app: FastifyInstance): Promise<void> {
  logger.debug('Matches module registered (scaffold)');
  void app;
}
