/**
 * Leagues module registration.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('leagues');

export async function registerLeaguesModule(app: FastifyInstance): Promise<void> {
  logger.debug('Leagues module registered (scaffold)');
  void app;
}
