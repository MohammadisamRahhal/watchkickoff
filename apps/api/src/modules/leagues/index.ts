import type { FastifyInstance } from 'fastify';
import { registerLeaguesRoutes } from './leagues.routes.js';
import { createLogger } from '@core/logger.js';
const logger = createLogger('leagues');
export async function registerLeaguesModule(app: FastifyInstance): Promise<void> {
  await app.register(registerLeaguesRoutes, { prefix: '/leagues' });
  logger.debug('Leagues module registered');
}
