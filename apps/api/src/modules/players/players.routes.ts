import { FastifyInstance } from 'fastify';
import { playersService } from './players.service.js';

export async function registerPlayersRoutes(app: FastifyInstance) {
  app.get('/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const data = await playersService.getPlayerBySlug(slug);
    if (!data) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Player not found' } });
    return reply.send({ data });
  });

  app.get('/:slug/stats', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const { season } = req.query as { season?: string };
    return reply.send({ data: await playersService.getPlayerStats(slug, season) });
  });

  app.get('/:slug/career', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    return reply.send({ data: await playersService.getPlayerCareer(slug) });
  });

  app.get('/:slug/matches', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    return reply.send({ data: await playersService.getPlayerRecentMatches(slug) });
  });
}
