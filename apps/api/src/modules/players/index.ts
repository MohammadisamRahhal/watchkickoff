/**
 * Players module registration.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('players');

export async function registerPlayersModule(app: FastifyInstance): Promise<void> {
  logger.debug('Players module registered (scaffold)');
  void app;
}
