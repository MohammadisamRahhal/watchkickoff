/**
 * Migration runner — run via: npm run db:migrate
 */
import { drizzle }  from 'drizzle-orm/node-postgres';
import { migrate }  from 'drizzle-orm/node-postgres/migrator';
import { Pool }     from 'pg';
import { config }   from '@config/env.js';
import { createLogger } from '@core/logger.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const logger = createLogger('migrate');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations(): Promise<void> {
  logger.info('Starting database migrations');

  const pool = new Pool({ connectionString: config.DATABASE_URL });

  try {
    const db = drizzle(pool);
    await migrate(db, {
      migrationsFolder: path.join(__dirname, 'migrations'),
    });
    logger.info('All migrations applied successfully');
  } catch (err) {
    logger.error({ err }, 'Migration failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

await runMigrations();
