/**
 * Matches queries — ALL SQL for the matches module lives here.
 */
import { db } from '@infrastructure/database/client.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('matches-queries');

// Query functions implemented in subsequent phases
export const matchesQueries = {
  _logger: logger,
  _db: db,
};
