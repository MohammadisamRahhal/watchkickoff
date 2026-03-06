/**
 * infrastructure/http/football-api.client.ts — Centralised API-Football HTTP client.
 *
 * This is the ONLY place in the codebase that makes HTTP calls to API-Football.
 * All other files that need provider data go through the adapter (providers/api-football/),
 * which uses this client.
 *
 * Responsibilities:
 *   - Inject API key header (read from config — never hardcoded)
 *   - Enforce rate limit via checkAndIncrementQuota() on every request
 *   - Apply timeout (10s)
 *   - Log all requests at debug level (redact API key)
 *   - Normalise HTTP errors to ProviderError
 */

import { config }                   from '../../config/env.js';
import { createLogger }             from '../../core/logger.js';
import { ProviderError }            from '../../core/errors/app-error.js';
import { checkAndIncrementQuota }   from './rate-limiter.js';
import type { ErrorCode }           from '../../core/errors/error-codes.js';

const logger = createLogger('football-api-client');

const REQUEST_TIMEOUT_MS = 10_000;

// ── Internal fetch wrapper ────────────────────────────────────────────────────

async function apiFetch(path: string): Promise<unknown> {
  // Quota check BEFORE dispatching the HTTP request
  await checkAndIncrementQuota();

  const url = `${config.FOOTBALL_API_BASE_URL}${path}`;

  logger.debug({ path }, 'API-Football request');

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'x-apisports-key': config.FOOTBALL_API_KEY,   // Key injected from config only
        'Accept':          'application/json',
      },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      logger.warn({ path }, 'API-Football request timed out');
      throw new ProviderError('PROVIDER_TIMEOUT', `Request to ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`, 504);
    }
    logger.error({ path, err }, 'API-Football network error');
    throw new ProviderError('PROVIDER_UNAVAILABLE', 'Network error reaching data provider', 503);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorCode = httpStatusToErrorCode(response.status);
    logger.warn({ path, status: response.status }, 'API-Football HTTP error');
    throw new ProviderError(errorCode, `API-Football returned HTTP ${response.status}`, response.status);
  }

  const body = await response.json() as unknown;
  logger.debug({ path, status: response.status }, 'API-Football response received');
  return body;
}

function httpStatusToErrorCode(status: number): ErrorCode {
  if (status === 401 || status === 403) return 'PROVIDER_AUTH_FAILURE';
  if (status === 429)                   return 'PROVIDER_RATE_LIMITED';
  if (status === 404)                   return 'NOT_FOUND_GENERIC';
  return 'PROVIDER_UNAVAILABLE';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch a path from the API-Football API.
 * Path should begin with '/' e.g. '/fixtures?live=all'
 */
export async function footballApiGet(path: string): Promise<unknown> {
  return apiFetch(path);
}
