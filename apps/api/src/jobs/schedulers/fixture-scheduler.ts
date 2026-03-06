/**
 * fixture scheduler — manages BullMQ job scheduling for fixture sync.
 * Full implementation in subsequent phases.
 */
import { createLogger } from '@core/logger.js';

const logger = createLogger('scheduler:fixture');

export async function startFixtureScheduler(): Promise<void> {
  logger.info('Fixture scheduler started');
  // Implementation in subsequent phases
}

export async function stopFixtureScheduler(): Promise<void> {
  logger.info('Fixture scheduler stopped');
}
