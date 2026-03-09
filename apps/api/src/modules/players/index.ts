import type { FastifyInstance } from 'fastify';
import { registerPlayersRoutes } from './players.routes.js';
import { createLogger } from '@core/logger.js';
const logger = createLogger('players');
export async function registerPlayersModule(app: FastifyInstance): Promise<void> {
  await app.register(registerPlayersRoutes, { prefix: '/players' });
  logger.debug('Players module registered');
}
