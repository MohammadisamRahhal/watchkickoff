import pino from 'pino';
import { config, isProduction } from '@config/env.js';

/**
 * Shared pino options — used by both rootLogger and Fastify's internal logger.
 * Exporting this object lets Fastify create its own pino instance with the same
 * config while keeping the TypeScript return type as FastifyInstance (not
 * FastifyInstance<..., pino.Logger>), which avoids the FastifyBaseLogger mismatch.
 */
export const pinoOptions: pino.LoggerOptions = {
  level: config.LOG_LEVEL,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize:      true,
          translateTime: 'SYS:HH:MM:ss',
          ignore:        'pid,hostname',
          messageFormat: '{module} › {msg}',
        },
      },
  base: {
    pid: process.pid,
    env: config.NODE_ENV,
  },
  redact: {
    paths:  ['req.headers.authorization', 'FOOTBALL_API_KEY', '*.apiKey', '*.password'],
    censor: '[REDACTED]',
  },
  serializers: {
    req(req: { method: string; url: string; socket?: { remoteAddress?: string } }) {
      return {
        method:        req.method,
        url:           req.url,
        remoteAddress: req.socket?.remoteAddress,
      };
    },
    res(res: { statusCode: number }) {
      return { statusCode: res.statusCode };
    },
  },
};

/** Root logger — used by createLogger() throughout the application. */
export const rootLogger = pino(pinoOptions);

export function createLogger(module: string): pino.Logger {
  return rootLogger.child({ module });
}

export type Logger = pino.Logger;
