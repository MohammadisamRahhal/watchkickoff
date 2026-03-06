/**
 * Matches routes — thin handlers only.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('matches-routes');

export async function registerMatchesRoutes(fastify: FastifyInstance): Promise<void> {
  // Routes implemented in subsequent phases
  logger.debug('Matches routes registered');
  void fastify;
}
