/**
 * core/ws/ws.gateway.ts — WebSocket server: connection lifecycle.
 * Phase 1 status: STUB — implementation follows in WS implementation phase.
 */
import type { FastifyInstance } from 'fastify';
import { createLogger } from '../logger.js';

const logger = createLogger('ws-gateway');

export function registerWsGateway(app: FastifyInstance): void {
  logger.info('WebSocket gateway registered (stub)');
  void app;
}
