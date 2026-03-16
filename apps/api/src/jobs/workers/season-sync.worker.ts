/**
 * season-sync worker — DISABLED.
 * Replaced by sync-season-2025.js script and optimized workers.
 */
import { createLogger } from '@core/logger.js';
const logger = createLogger('worker:season-sync');

export async function runSeasonSync(): Promise<void> {
  logger.info('season-sync disabled — skipping');
}
