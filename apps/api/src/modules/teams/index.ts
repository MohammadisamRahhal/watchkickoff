import type { FastifyInstance } from 'fastify';
import { registerTeamsRoutes } from './teams.routes.js';
import { createLogger } from '@core/logger.js';
const logger = createLogger('teams');
export async function registerTeamsModule(app: FastifyInstance): Promise<void> {
  await app.register(registerTeamsRoutes, { prefix: '/teams' });
  logger.debug('Teams module registered');
}
