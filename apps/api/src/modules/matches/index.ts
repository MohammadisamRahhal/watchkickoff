/**
 * Matches module registration.
 */
import type { FastifyInstance } from 'fastify';
import { registerMatchesRoutes } from './matches.routes.js';
import { createLogger } from '@core/logger.js';
const logger = createLogger('matches');
export async function registerMatchesModule(app: FastifyInstance): Promise<void> {
  await app.register(registerMatchesRoutes, { prefix: '/matches' });
  logger.debug('Matches module registered');
}
