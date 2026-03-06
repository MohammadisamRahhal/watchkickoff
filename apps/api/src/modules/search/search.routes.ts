import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('search-routes');

export async function registerSearchRoutes(fastify: FastifyInstance): Promise<void> {
  logger.debug('Search routes registered');
  void fastify;
}
