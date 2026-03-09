import type { FastifyInstance } from 'fastify';
import { searchService } from './search.service.js';
import { createLogger } from '@core/logger.js';
const logger = createLogger('search-routes');
export async function registerSearchRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', async (req, reply) => {
    const q = ((req as any).query?.q ?? '') as string;
    const data = await searchService.search(q);
    return reply.send(data);
  });
  logger.debug('Search routes registered');
}
