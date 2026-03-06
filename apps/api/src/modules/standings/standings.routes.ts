/**
 * Standings routes — thin handlers only.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('standings-routes');

export async function registerStandingsRoutes(fastify: FastifyInstance): Promise<void> {
  // Routes implemented in subsequent phases
  logger.debug('Standings routes registered');
  void fastify;
}
