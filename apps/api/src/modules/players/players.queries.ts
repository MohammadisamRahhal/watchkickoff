/**
 * Players queries — ALL SQL for the players module lives here.
 */
import { db } from '@infrastructure/database/client.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('players-queries');

// Query functions implemented in subsequent phases
export const playersQueries = {
  _logger: logger,
  _db: db,
};
