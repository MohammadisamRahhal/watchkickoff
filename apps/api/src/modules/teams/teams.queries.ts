/**
 * Teams queries — ALL SQL for the teams module lives here.
 */
import { db } from '@infrastructure/database/client.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('teams-queries');

// Query functions implemented in subsequent phases
export const teamsQueries = {
  _logger: logger,
  _db: db,
};
