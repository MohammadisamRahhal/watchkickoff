/**
 * Standings module registration.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('standings');

export async function registerStandingsModule(app: FastifyInstance): Promise<void> {
  logger.debug('Standings module registered (scaffold)');
  void app;
}
