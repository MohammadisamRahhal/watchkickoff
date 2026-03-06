/**
 * standing scheduler — manages BullMQ job scheduling for standing sync.
 * Full implementation in subsequent phases.
 */
import { createLogger } from '@core/logger.js';

const logger = createLogger('scheduler:standing');

export async function startStandingScheduler(): Promise<void> {
  logger.info('Standing scheduler started');
  // Implementation in subsequent phases
}

export async function stopStandingScheduler(): Promise<void> {
  logger.info('Standing scheduler stopped');
}
