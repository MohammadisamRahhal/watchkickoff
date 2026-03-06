/**
 * Players routes — thin handlers only.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('players-routes');

export async function registerPlayersRoutes(fastify: FastifyInstance): Promise<void> {
  // Routes implemented in subsequent phases
  logger.debug('Players routes registered');
  void fastify;
}
