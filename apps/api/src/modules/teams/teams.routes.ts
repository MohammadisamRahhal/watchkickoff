import { FastifyInstance } from 'fastify';
import {
  getTeamBySlug, getTeamOverview, getTeamFixtures, getTeamResults,
  getTeamSquad, getTeamStandings, getTeamStats, getTeamTransfers,
} from './teams.service.js';

export async function registerTeamsRoutes(app: FastifyInstance) {

  app.get('/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const team = await getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    return { data: team };
  });

  app.get('/:slug/overview', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const team = await getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    const overview = await getTeamOverview((team as any).id);
    return { data: { team, ...overview } };
  });

  app.get('/:slug/fixtures', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const team = await getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    const fixtures = await getTeamFixtures((team as any).id);
    return { data: fixtures };
  });

  app.get('/:slug/results', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const team = await getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    const results = await getTeamResults((team as any).id);
    return { data: results };
  });

  app.get('/:slug/squad', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const team = await getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    const squad = await getTeamSquad((team as any).id);
    return { data: squad };
  });

  app.get('/:slug/standings', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const { season = '2025' } = req.query as { season?: string };
    const team = await getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    const standings = await getTeamStandings((team as any).id, season);
    return { data: standings };
  });

  app.get('/:slug/stats', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const { season = '2025' } = req.query as { season?: string };
    const team = await getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    const stats = await getTeamStats((team as any).id, season);
    return { data: stats };
  });

  app.get('/:slug/transfers', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const team = await getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    const transfers = await getTeamTransfers((team as any).id);
    return { data: transfers };
  });
}
