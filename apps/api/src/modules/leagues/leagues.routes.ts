/**
 * Leagues routes — thin handlers only.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('leagues-routes');

export async function registerLeaguesRoutes(fastify: FastifyInstance): Promise<void> {
  // Routes implemented in subsequent phases
  logger.debug('Leagues routes registered');
  void fastify;
}
