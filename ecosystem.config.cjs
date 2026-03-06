/**
 * ecosystem.config.cjs — PM2 process configuration.
 *
 * Three processes:
 *   wk-api:     Fastify API server + WebSocket gateway
 *   wk-workers: BullMQ workers + schedulers (separate process)
 *   wk-web:     Next.js SSR server (Phase 2)
 *
 * Separation strategy:
 *   - Workers restart independently from the API server
 *   - Memory limits prevent any single process from starving others
 *   - WORKERS_ENABLED=false prevents the API process from running workers
 */
module.exports = {
  apps: [
    {
      name:             'wk-api',
      script:           './apps/api/dist/server.js',
      instances:        1,
      exec_mode:        'fork',
      max_memory_restart: '1800M',
      watch:            false,
      log_date_format:  'YYYY-MM-DD HH:mm:ss',
      error_file:       './logs/api-error.log',
      out_file:         './logs/api-out.log',
      env_production: {
        NODE_ENV:         'production',
        PORT:             '3001',
        WORKERS_ENABLED:  'false',
      },
      env_development: {
        NODE_ENV:        'development',
        PORT:            '3001',
        WORKERS_ENABLED: 'false',
      },
    },
    {
      name:             'wk-workers',
      script:           './apps/api/dist/jobs/bootstrap.js',
      instances:        1,
      exec_mode:        'fork',
      max_memory_restart: '900M',
      watch:            false,
      log_date_format:  'YYYY-MM-DD HH:mm:ss',
      error_file:       './logs/workers-error.log',
      out_file:         './logs/workers-out.log',
      env_production: {
        NODE_ENV:        'production',
        WORKERS_ENABLED: 'true',
      },
      env_development: {
        NODE_ENV:        'development',
        WORKERS_ENABLED: 'true',
      },
    },
    {
      name:             'wk-web',
      script:           'node_modules/.bin/next',
      args:             'start',
      cwd:              './apps/web',
      instances:        1,
      exec_mode:        'fork',
      max_memory_restart: '1200M',
      watch:            false,
      log_date_format:  'YYYY-MM-DD HH:mm:ss',
      error_file:       './logs/web-error.log',
      out_file:         './logs/web-out.log',
      env_production: {
        NODE_ENV: 'production',
        PORT:     '3000',
      },
    },
  ],
};
