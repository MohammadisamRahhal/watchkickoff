/**
 * live scheduler — manages BullMQ job scheduling for live sync.
 * Full implementation in subsequent phases.
 */
import { createLogger } from '@core/logger.js';

const logger = createLogger('scheduler:live');

export async function startLiveScheduler(): Promise<void> {
  logger.info('Live scheduler started');
  // Implementation in subsequent phases
}

export async function stopLiveScheduler(): Promise<void> {
  logger.info('Live scheduler stopped');
}
