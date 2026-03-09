import { searchQueries } from './search.queries.js';
import { createLogger } from '@core/logger.js';
const logger = createLogger('search-service');
export const searchService = {
  _logger: logger,
  async search(q: string) {
    if (!q || q.trim().length < 2) return { teams: [], leagues: [], players: [] };
    return searchQueries.search(q.trim());
  },
};
