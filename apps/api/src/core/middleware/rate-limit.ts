import type { FastifyInstance, FastifyRequest } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import { config } from '@config/env.js';
import { createLogger } from '@core/logger.js';

const logger = createLogger('rate-limit');

export async function rateLimitPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyRateLimit, {
    max:        config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,

    keyGenerator(request: FastifyRequest) {
      const cfIp = request.headers['cf-connecting-ip'];
      if (typeof cfIp === 'string' && cfIp.length > 0) return cfIp;
      return request.ip;
    },

    errorResponseBuilder(_request: FastifyRequest, context: { ttl: number }) {
      return {
        error: {
          code:    'RATE_LIMIT_CLIENT',
          message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
          retryAfterSeconds: Math.ceil(context.ttl / 1000),
        },
      };
    },

    onExceeded(request: FastifyRequest) {
      logger.warn({ ip: request.ip, url: request.url }, 'Client rate limit exceeded');
    },
  });
}
