import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import { config } from '@config/env.js';

export async function correlationIdPlugin(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const headerName    = config.CORRELATION_ID_HEADER;
    const existingId    = request.headers[headerName];
    const correlationId = (typeof existingId === 'string' && existingId.length > 0)
      ? existingId
      : randomUUID();

    request.correlationId = correlationId;
    request.log = request.log.child({ correlationId });
    void reply.header(headerName, correlationId);
  });
}

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string;
  }
}
