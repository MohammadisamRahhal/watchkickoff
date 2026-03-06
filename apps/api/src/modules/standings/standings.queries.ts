/**
 * Standings queries — ALL SQL for the standings module lives here.
 */
import { db } from '@infrastructure/database/client.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('standings-queries');

// Query functions implemented in subsequent phases
export const standingsQueries = {
  _logger: logger,
  _db: db,
};
