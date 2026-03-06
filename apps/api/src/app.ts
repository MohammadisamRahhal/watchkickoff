/**
 * Fastify application factory.
 *
 * The app is typed as FastifyInstance (default type parameters) rather than
 * FastifyInstance<..., pino.Logger>. Passing a pino.Logger instance to Fastify
 * shifts the Logger type parameter from FastifyBaseLogger to pino.Logger, making
 * the return type incompatible with FastifyInstance at the call site.
 *
 * Fix: pass pinoOptions (a plain options object) instead of rootLogger (an instance).
 * Fastify creates its own internal pino logger from the options, the Logger type
 * parameter stays FastifyBaseLogger, and the return type matches FastifyInstance.
 */
import Fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import { pinoOptions }             from '@core/logger.js';
import { buildErrorHandler }       from '@core/errors/error-handler.js';
import { correlationIdPlugin }     from '@core/middleware/correlation-id.js';
import { rateLimitPlugin }         from '@core/middleware/rate-limit.js';
import { config }                  from '@config/env.js';
import { checkDatabaseConnection } from '@infrastructure/database/client.js';
import { getRedisClient }          from '@infrastructure/redis/client.js';

import { registerMatchesModule }   from '@modules/matches/index.js';
import { registerLeaguesModule }   from '@modules/leagues/index.js';
import { registerTeamsModule }     from '@modules/teams/index.js';
import { registerStandingsModule } from '@modules/standings/index.js';
import { registerPlayersModule }   from '@modules/players/index.js';
import { registerSearchModule }    from '@modules/search/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  // Explicit type annotation ensures the inferred Logger type parameter stays
  // as FastifyBaseLogger (the default), matching the declared return type.
  const app: FastifyInstance = Fastify({
    logger:     pinoOptions,
    genReqId:   () => `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    trustProxy: true,
    ajv: {
      customOptions: { strict: false },
    },
  });

  await app.register(fastifyCors, {
    origin:         config.CORS_ORIGIN,
    methods:        ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', config.CORRELATION_ID_HEADER],
    credentials:    false,
    maxAge:         86_400,
  });

  await app.register(correlationIdPlugin);
  await app.register(rateLimitPlugin);

  app.setErrorHandler(buildErrorHandler());

  // Health endpoint — probes DB and Redis
  app.get('/health', async (_request, _reply) => {
    const [dbOk, redisOk] = await Promise.all([
      checkDatabaseConnection(),
      (async () => {
        try {
          const pong = await getRedisClient().ping();
          return pong === 'PONG';
        } catch {
          return false;
        }
      })(),
    ]);

    return {
      status:    'ok',
      db:        dbOk,
      redis:     redisOk,
      timestamp: new Date().toISOString(),
    };
  });

  await app.register(async (api) => {
    await registerMatchesModule(api);
    await registerLeaguesModule(api);
    await registerTeamsModule(api);
    await registerStandingsModule(api);
    await registerPlayersModule(api);
    await registerSearchModule(api);
  }, { prefix: '/api/v1' });

  return app;
}
