import type { FastifyInstance } from 'fastify';
import { leaguesService } from './leagues.service.js';

export async function registerLeaguesRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_req, reply) => {
    return leaguesService.getAllLeagues();
  });

  fastify.get('/:slug', async (req: any, reply) => {
    const { slug } = req.params;
    const league = await leaguesService.getLeagueBySlug(slug);
    if (!league) return reply.code(404).send({ error: 'Not found' });
    return league;
  });

  fastify.get('/:slug/seasons', async (req: any, _reply) => {
    const { slug } = req.params;
    return leaguesService.getLeagueSeasons(slug);
  });

  fastify.get('/:slug/rounds', async (req: any, _reply) => {
    const { slug } = req.params;
    const { season } = req.query as any;
    return leaguesService.getLeagueRounds(slug, season);
  });

  fastify.get('/:slug/matches', async (req: any, _reply) => {
    const { slug } = req.params;
    const { season, round } = req.query as any;
    return leaguesService.getLeagueMatches(slug, season, round);
  });

  fastify.get('/:slug/standings', async (req: any, _reply) => {
    const { slug } = req.params;
    return leaguesService.getLeagueStandings(slug);
  });

  fastify.get('/:slug/scorers', async (req: any, _reply) => {
    const { slug } = req.params;
    return leaguesService.getLeagueTopScorers(slug);
  });
}
