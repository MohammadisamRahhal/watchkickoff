/**
 * Leagues routes — thin handlers only.
 */
import type { FastifyInstance } from 'fastify';
import { leaguesService } from './leagues.service.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('leagues-routes');

export async function registerLeaguesRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /leagues
  fastify.get('/', async (_req, reply) => {
    const data = await leaguesService.getAllLeagues();
    return reply.send(data);
  });

  // GET /leagues/:slug
  fastify.get('/:slug', async (req, reply) => {
    const { slug } = (req as any).params;
    const league = await leaguesService.getLeagueBySlug(slug);
    if (!league) return reply.code(404).send({ error: 'League not found' });
    return reply.send(league);
  });

  // GET /leagues/:slug/matches
  fastify.get('/:slug/matches', async (req, reply) => {
    const { slug } = (req as any).params;
    const data = await leaguesService.getLeagueMatches(slug);
    return reply.send(data);
  });

  // GET /leagues/:slug/standings
  fastify.get('/:slug/standings', async (req, reply) => {
    const { slug } = (req as any).params;
    const data = await leaguesService.getLeagueStandings(slug);
    return reply.send(data);
  });

  // GET /leagues/:slug/scorers
  fastify.get('/:slug/scorers', async (req, reply) => {
    const { slug } = (req as any).params;
    const data = await leaguesService.getLeagueTopScorers(slug);
    return reply.send(data);
  });

  logger.debug('Leagues routes registered');
}
