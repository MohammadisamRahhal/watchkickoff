import type { FastifyInstance } from 'fastify';
import { registerStandingsRoutes } from './standings.routes.js';
import { createLogger } from '@core/logger.js';
const logger = createLogger('standings');
export async function registerStandingsModule(app: FastifyInstance): Promise<void> {
  await app.register(registerStandingsRoutes, { prefix: '/standings' });
  logger.debug('Standings module registered');
}
