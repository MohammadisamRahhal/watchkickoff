import { drizzle }                       from 'drizzle-orm/node-postgres';
import type { NodePgDatabase }           from 'drizzle-orm/node-postgres';
import { Pool }                          from 'pg';
import * as schema                       from './schema.js';
import { config }                        from '@config/env.js';
import { createLogger }                  from '@core/logger.js';

const logger = createLogger('database');

let _pool: Pool | null = null;
let _db:   NodePgDatabase<typeof schema> | null = null;

function init(): NodePgDatabase<typeof schema> {
  if (_db !== null) return _db;

  _pool = new Pool({
    connectionString:        config.DATABASE_URL,
    min:                     config.DB_POOL_MIN,
    max:                     config.DB_POOL_MAX,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis:       30_000,
  });

  _pool.on('connect', () => logger.debug('New DB pool connection established'));
  _pool.on('error',   (err: Error) => logger.error({ err }, 'DB pool error'));

  _db = drizzle(_pool, { schema, logger: false });
  logger.info({ min: config.DB_POOL_MIN, max: config.DB_POOL_MAX }, 'Database pool created');
  return _db;
}

export function getDatabaseClient(): NodePgDatabase<typeof schema> { return init(); }
export const db = init();

export async function closeDatabaseClient(): Promise<void> {
  if (_pool !== null) {
    await _pool.end();
    _pool = null;
    _db   = null;
    logger.info('Database pool closed');
  }
}

export const closeDatabasePool = closeDatabaseClient;

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await _pool?.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export type Db = NodePgDatabase<typeof schema>;
