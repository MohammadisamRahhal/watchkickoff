import { playersQueries } from './players.queries.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('players-service');

export const playersService = {
  _logger: logger,

  async getPlayerBySlug(slug: string) {
    const row = await playersQueries.findBySlug(slug);
    if (!row) return null;
    return {
      id: row.id, name: row.name, slug: row.slug,
      position: row.position ?? null, nationalityCode: row.nationalityCode ?? null,
      dateOfBirth: row.dateOfBirth ?? null, heightCm: row.heightCm ?? null,
      preferredFoot: row.preferredFoot ?? null, status: row.status,
      currentTeamId: row.currentTeamId ?? null,
    };
  },

  async getPlayerStats(playerId: string) {
    return playersQueries.findStatsByPlayerId(playerId);
  },
};
