/**
 * Search service — full-text search business logic.
 */
import { db } from '@infrastructure/database/client.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('search-service');

export const searchService = {
  _logger: logger,
  _db: db,
};
