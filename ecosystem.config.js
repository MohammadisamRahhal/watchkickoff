/**
 * PM2 Ecosystem Configuration
 *
 * Three processes:
 *   wk-api      — Fastify HTTP + WebSocket server
 *   wk-workers  — BullMQ workers (ingestion, fanout, revalidation)
 *   wk-web      — Next.js SSR server
 *
 * Workers are separated from the API server so they can be restarted
 * independently during fixture sync storms or memory spikes.
 *
 * Memory limits: PM2 restarts a process before it OOM-kills it.
 * Total allocated: ~4.7 GB of 16 GB — leaves headroom for PostgreSQL (4 GB)
 * and Redis (2 GB) running on the same VPS.
 */
'use strict';

module.exports = {
  apps: [
    {
      name:    'wk-api',
      script:  './apps/api/dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1800M',
      // Load .env from monorepo root.
      env_production: {
        NODE_ENV:         'production',
        PORT:             '3001',
        WORKERS_ENABLED:  'false',
      },
      env_development: {
        NODE_ENV:  'development',
        PORT:      '3001',
      },
      // Log files — PM2 log rotation handles disk management.
      out_file:  './logs/wk-api-out.log',
      error_file:'./logs/wk-api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Auto-restart on crash — backoff to prevent thrash loops.
      restart_delay: 3000,
      max_restarts:  10,
      min_uptime:    '5s',
    },
    {
      name:    'wk-workers',
      script:  './apps/api/dist/jobs/bootstrap.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '900M',
      env_production: {
        NODE_ENV:        'production',
        WORKERS_ENABLED: 'true',
      },
      env_development: {
        NODE_ENV:        'development',
        WORKERS_ENABLED: 'true',
      },
      out_file:   './logs/wk-workers-out.log',
      error_file: './logs/wk-workers-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 5000,
      max_restarts:  10,
      min_uptime:    '10s',
    },
    {
      name:    'wk-web',
      script:  'node_modules/.bin/next',
      args:    'start',
      cwd:     './apps/web',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1200M',
      env_production: {
        NODE_ENV: 'production',
        PORT:     '3000',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT:     '3000',
      },
      out_file:   './logs/wk-web-out.log',
      error_file: './logs/wk-web-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts:  10,
      min_uptime:    '5s',
    },
  ],
};
