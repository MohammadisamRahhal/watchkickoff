/**
 * Search module registration.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('search');

export async function registerSearchModule(app: FastifyInstance): Promise<void> {
  logger.debug('Search module registered (scaffold)');
  void app;
}
