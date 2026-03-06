/**
 * Matches routes — thin handlers only.
 */
import type { FastifyInstance } from 'fastify';
import { matchesService } from './matches.service.js';
import { MatchesIdParamsSchema } from './matches.schema.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('matches-routes');

export async function registerMatchesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', async (_req, reply) => {
    const data = await matchesService.getTodayMatches();
    return reply.send({ data, count: data.length });
  });
  fastify.get('/today', async (_req, reply) => {
    const data = await matchesService.getTodayMatches();
    const summary = data.map(m => ({
      id:         m.id,
      slug:       m.slug,
      leagueId:   m.league.id,
      homeTeamId: m.homeTeam.id,
      awayTeamId: m.awayTeam.id,
      kickoffAt:  m.kickoffAt,
      status:     m.status,
      homeScore:  m.score.home,
      awayScore:  m.score.away,
      minute:     m.minute,
      minuteExtra: null,
      season:     '2025',
      round:      m.round,
      venue:      m.venue,
      homeTeam:   { id: m.homeTeam.id, name: m.homeTeam.name, slug: m.homeTeam.slug, shortName: null, crestUrl: m.homeTeam.crestUrl, countryCode: 'WW' },
      awayTeam:   { id: m.awayTeam.id, name: m.awayTeam.name, slug: m.awayTeam.slug, shortName: null, crestUrl: m.awayTeam.crestUrl, countryCode: 'WW' },
    }));
    return reply.send(summary);
  });
  fastify.get('/live', async (_req, reply) => {
    const data = await matchesService.getLiveMatches();
    return reply.send(data);
  });
  fastify.get('/:id', async (req, reply) => {
    const { id } = MatchesIdParamsSchema.parse((req as any).params);
    const match = await matchesService.getMatchById(id);
    if (!match) return reply.code(404).send({ error: 'Match not found' });
    return reply.send({ data: match });
  });
  fastify.get('/:id/events', async (req, reply) => {
    const { id } = MatchesIdParamsSchema.parse((req as any).params);
    const events = await matchesService.getMatchEvents(id);
    return reply.send({ data: events, count: events.length });
  });
  logger.debug('Matches routes registered');
}
