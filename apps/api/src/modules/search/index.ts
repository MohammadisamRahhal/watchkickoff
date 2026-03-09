import type { FastifyInstance } from 'fastify';
import { registerSearchRoutes } from './search.routes.js';
import { createLogger } from '@core/logger.js';
const logger = createLogger('search');
export async function registerSearchModule(app: FastifyInstance): Promise<void> {
  await app.register(registerSearchRoutes, { prefix: '/search' });
  logger.debug('Search module registered');
}
