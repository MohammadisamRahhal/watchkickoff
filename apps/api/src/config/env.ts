/**
 * Centralized environment configuration.
 * THE ONLY FILE IN THE CODEBASE THAT READS process.env.
 */
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT:     z.coerce.number().int().min(1).max(65535),

  DATABASE_URL:  z.string().url().startsWith('postgresql://'),
  DB_POOL_MIN:   z.coerce.number().int().min(1).default(2),
  DB_POOL_MAX:   z.coerce.number().int().min(1).default(20),

  // Full URL for ioredis cache / pub-sub clients
  REDIS_URL:  z.string().min(1),
  // Host + port used by BullMQ (plain connection options — no ioredis instance)
  REDIS_HOST: z.string().min(1).default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

  FOOTBALL_API_KEY:              z.string().min(1),
  FOOTBALL_API_BASE_URL:         z.string().url(),
  FOOTBALL_API_DAILY_LIMIT:      z.coerce.number().int().min(1).default(7000),
  FOOTBALL_API_PER_MINUTE_LIMIT: z.coerce.number().int().min(1).default(30),

  CORS_ORIGIN: z.string().url(),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  SYNC_INTERVAL_LIVE_MS:       z.coerce.number().int().min(5000).default(15000),
  SYNC_INTERVAL_FIXTURE_CRON:  z.string().min(9).default('0 */6 * * *'),
  SYNC_INTERVAL_STANDING_CRON: z.string().min(9).default('0 4 * * *'),

  RATE_LIMIT_MAX:       z.coerce.number().int().min(1).default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),

  CORRELATION_ID_HEADER: z.string().min(1).default('x-correlation-id'),

  BULL_BOARD_ENABLED:  z.string().transform((v: string) => v === 'true').default('false'),
  BULL_BOARD_PASSWORD: z.string().optional(),

  NEXT_REVALIDATION_TOKEN: z.string().optional(),
  NEXT_URL:                z.string().url().optional(),
});

const _parsed = EnvSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('');
  console.error('════════════════════════════════════════════════════════');
  console.error('  STARTUP FAILURE: Invalid environment configuration');
  console.error('════════════════════════════════════════════════════════');
  for (const issue of _parsed.error.issues) {
    const path = issue.path.join('.');
    console.error(`  ✗  ${path}: ${issue.message}`);
  }
  console.error('════════════════════════════════════════════════════════');
  console.error('  Copy .env.example to .env and fill in all required values.');
  console.error('');
  process.exit(1);
}

export const config = Object.freeze(_parsed.data);
export const isProduction  = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest        = config.NODE_ENV === 'test';
export type Config = typeof config;
