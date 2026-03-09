/**
 * Matches routes — thin handlers only.
 */
import type { FastifyInstance } from 'fastify';
import { matchesService } from './matches.service.js';
import { MatchesIdParamsSchema, MatchesSlugParamsSchema } from './matches.schema.js';
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
      leagueId:          m.league.id,
      leagueName:        m.league.name,
      leagueSlug:        m.league.slug,
      leagueCountryCode: m.league.countryCode,
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
  fastify.get('/:slug', async (req, reply) => {
    const { slug } = MatchesSlugParamsSchema.parse((req as any).params);
    const match = await matchesService.getMatchBySlug(slug);
    if (!match) return reply.code(404).send({ error: 'Match not found' });
    const events = await matchesService.getMatchEvents(match.id);
    return reply.send({ ...match, events });
  });
  fastify.get('/:slug/events', async (req, reply) => {
    const { slug } = MatchesSlugParamsSchema.parse((req as any).params);
    const match = await matchesService.getMatchBySlug(slug);
    if (!match) return reply.code(404).send({ error: 'Match not found' });
    const events = await matchesService.getMatchEvents(match.id);
    return reply.send(events);
  });
  logger.debug('Matches routes registered');
}
