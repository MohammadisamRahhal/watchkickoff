import type { FastifyInstance } from 'fastify';
import { teamsService } from './teams.service.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('teams-routes');

export async function registerTeamsRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /teams/:slug
  fastify.get('/:slug', async (req, reply) => {
    const { slug } = (req as any).params;
    const team = await teamsService.getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: 'Team not found' });
    return reply.send(team);
  });

  // GET /teams/:slug/matches
  fastify.get('/:slug/matches', async (req, reply) => {
    const { slug } = (req as any).params;
    const team = await teamsService.getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: 'Team not found' });
    const data = await teamsService.getTeamMatches(team.id);
    return reply.send(data);
  });

  // GET /teams/:slug/standings
  fastify.get('/:slug/standings', async (req, reply) => {
    const { slug } = (req as any).params;
    const team = await teamsService.getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: 'Team not found' });
    const data = await teamsService.getTeamStandings(team.id);
    return reply.send(data);
  });

  // GET /teams/:slug/squad
  fastify.get('/:slug/squad', async (req, reply) => {
    const { slug } = (req as any).params;
    const team = await teamsService.getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: 'Team not found' });
    const data = await teamsService.getTeamSquad(team.id);
    return reply.send(data);
  });

  logger.debug('Teams routes registered');
}
