/**
 * Teams routes — thin handlers only.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('teams-routes');

export async function registerTeamsRoutes(fastify: FastifyInstance): Promise<void> {
  // Routes implemented in subsequent phases
  logger.debug('Teams routes registered');
  void fastify;
}
