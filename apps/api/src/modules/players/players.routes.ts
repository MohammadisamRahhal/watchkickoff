import type { FastifyInstance } from 'fastify';
import { playersService } from './players.service.js';
import { createLogger } from '@core/logger.js';
const logger = createLogger('players-routes');
export async function registerPlayersRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/:slug', async (req, reply) => {
    const { slug } = (req as any).params;
    const player = await playersService.getPlayerBySlug(slug);
    if (!player) return reply.code(404).send({ error: 'Player not found' });
    return reply.send(player);
  });
  fastify.get('/:slug/stats', async (req, reply) => {
    const { slug } = (req as any).params;
    const player = await playersService.getPlayerBySlug(slug);
    if (!player) return reply.code(404).send({ error: 'Player not found' });
    const stats = await playersService.getPlayerStats(player.id);
    return reply.send(stats);
  });
  logger.debug('Players routes registered');
}
