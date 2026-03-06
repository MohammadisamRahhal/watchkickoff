/**
 * Teams module registration.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '@core/logger.js';

const logger = createLogger('teams');

export async function registerTeamsModule(app: FastifyInstance): Promise<void> {
  logger.debug('Teams module registered (scaffold)');
  void app;
}
