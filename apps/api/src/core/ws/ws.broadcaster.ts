/**
 * core/ws/ws.broadcaster.ts — Redis subscriber → WebSocket fan-out.
 * Phase 1 status: STUB — implementation follows in WS implementation phase.
 */
import { createLogger } from '../logger.js';

const logger = createLogger('ws-broadcaster');

export function startBroadcaster(): void {
  logger.info('WebSocket broadcaster started (stub)');
}
