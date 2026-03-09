/**
 * Standings routes — thin handlers only.
 */
import type { FastifyInstance } from 'fastify';
import { standingsService } from './standings.service.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('standings-routes');

export async function registerStandingsRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /standings/:leagueId/:season
  fastify.get('/:leagueId/:season', async (req, reply) => {
    const { leagueId, season } = (req as any).params;
    const data = await standingsService.getByLeague(leagueId, season);
    return reply.send(data);
  });

  logger.debug('Standings routes registered');
}
