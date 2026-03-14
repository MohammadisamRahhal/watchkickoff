import type { FastifyInstance } from 'fastify';
import { matchesService } from './matches.service.js';
import { MatchesSlugParamsSchema } from './matches.schema.js';
import { createLogger } from '@core/logger.js';
import { matchesQueries } from './matches.queries.js';

const logger = createLogger('matches-routes');

function toSummary(m: any) {
  return {
    id: m.id, slug: m.slug,
    leagueId: m.league?.id ?? m.leagueId,
    leagueName: m.league?.name ?? m.leagueName,
    leagueSlug: m.league?.slug ?? m.leagueSlug,
    leagueCountryCode: m.league?.countryCode ?? m.leagueCountryCode,
    leagueLogoUrl: m.league?.logoUrl ?? m.leagueLogoUrl ?? null,
    homeTeamId: m.homeTeam?.id, awayTeamId: m.awayTeam?.id,
    kickoffAt: m.kickoffAt, status: m.status,
    homeScore: m.score?.home ?? m.homeScore ?? 0,
    awayScore: m.score?.away ?? m.awayScore ?? 0,
    minute: m.minute ?? null, minuteExtra: null,
    season: m.season ?? '2025', round: m.round ?? null, venue: m.venue ?? null,
    homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name, slug: m.homeTeam.slug, shortName: null, crestUrl: m.homeTeam.crestUrl, countryCode: 'WW' } : null,
    awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name, slug: m.awayTeam.slug, shortName: null, crestUrl: m.awayTeam.crestUrl, countryCode: 'WW' } : null,
  };
}

export async function registerMatchesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', async (_req, reply) => {
    const data = await matchesService.getTodayMatches();
    return reply.send({ data, count: data.length });
  });

  fastify.get('/today', async (_req, reply) => {
    const data = await matchesService.getTodayMatches();
    return reply.send(data.map(toSummary));
  });

  fastify.get('/by-date/:date', async (req, reply) => {
    const { date } = (req as any).params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return reply.code(400).send({ error: 'Invalid date. Use YYYY-MM-DD' });
    const data = await matchesService.getMatchesByDate(date);
    return reply.send(data.map(toSummary));
  });

  fastify.get('/live', async (_req, reply) => {
    const data = await matchesService.getLiveMatches();
    return reply.send(data);
  });


  fastify.get('/by-fixture/:fixtureId', async (req, reply) => {
    const { fixtureId } = (req as any).params;
    const row = await matchesQueries.findByProviderRef(fixtureId);
    if (!row) return reply.code(404).send({ error: 'Match not found' });
    return reply.send({ slug: row.slug });
  });

  fastify.get('/h2h', async (req, reply) => {
    const { homeTeamId, awayTeamId, limit = '10' } = (req as any).query;
    if (!homeTeamId || !awayTeamId) return reply.code(400).send({ error: 'homeTeamId and awayTeamId required' });
    const data = await matchesQueries.findH2HMatches(homeTeamId, awayTeamId, Math.min(parseInt(limit), 20));
    return reply.send(data);
  });

  fastify.get('/:slug', async (req, reply) => {
    const { slug } = MatchesSlugParamsSchema.parse((req as any).params);
    const full = await matchesQueries.findFullMatchBySlug(slug);
    if (!full) return reply.code(404).send({ error: 'Match not found' });
    return reply.send(full);
  });

  fastify.get('/:slug/events', async (req, reply) => {
    const { slug } = MatchesSlugParamsSchema.parse((req as any).params);
    const match = await matchesService.getMatchBySlug(slug);
    if (!match) return reply.code(404).send({ error: 'Match not found' });
    const events = await matchesService.getMatchEvents(match.id);
    return reply.send(events);
  });

  fastify.get('/:slug/lineups', async (req, reply) => {
    const { slug } = (req as any).params;
    const match = await matchesQueries.findBySlug(slug);
    if (!match) return reply.code(404).send({ error: 'Match not found' });
    const data = await matchesQueries.findLineupsByMatchId(match.id as string);
    return reply.send(data);
  });

  logger.debug('Matches routes registered');
}
