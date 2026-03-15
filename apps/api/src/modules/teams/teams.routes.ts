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

  app.get('/coach/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const { db } = await import('@infrastructure/database/client.js');
    const { sql } = await import('drizzle-orm');
    const result = await db.execute(sql`
      SELECT id, name, slug, crest_url, coach_name, coach_photo, country_code
      FROM teams WHERE coach_name ILIKE ${name} LIMIT 1
    `);
    if (!result.rows[0]) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Coach not found' } });
    return { data: result.rows[0] };
  });

  app.get('/:slug/transfers', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const team = await getTeamBySlug(slug);
    if (!team) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    const transfers = await getTeamTransfers((team as any).id);
    return { data: transfers };
  });
}
