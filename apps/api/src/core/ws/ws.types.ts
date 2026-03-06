/**
 * WebSocket message type definitions.
 *
 * All messages sent between server and client use these typed shapes.
 * Client and server both import from @watchkickoff/shared for entity types.
 */
import type { LiveMatchUpdate } from '@watchkickoff/shared';

/** Message types sent from server to client. */
export type ServerMessage =
  | { type: 'LIVE_UPDATE';   data: LiveMatchUpdate }
  | { type: 'MATCH_FINISHED'; matchId: string }
  | { type: 'PONG' }
  | { type: 'ERROR';          code: string; message: string };

/** Message types sent from client to server. */
export type ClientMessage =
  | { type: 'SUBSCRIBE';    matchIds: string[] }
  | { type: 'UNSUBSCRIBE';  matchIds: string[] }
  | { type: 'PING' };
