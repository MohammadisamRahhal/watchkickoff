/**
 * Leagues queries — ALL SQL for the leagues module lives here.
 */
import { db } from '@infrastructure/database/client.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('leagues-queries');

// Query functions implemented in subsequent phases
export const leaguesQueries = {
  _logger: logger,
  _db: db,
};
