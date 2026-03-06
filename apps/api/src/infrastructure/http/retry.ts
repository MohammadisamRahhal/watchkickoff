/**
 * infrastructure/http/retry.ts — Retry strategy with exponential backoff + jitter.
 *
 * Used by the football-api.client to wrap all provider HTTP calls.
 * Retry logic lives here — NOT in BullMQ job handlers and NOT in adapters.
 */

import { createLogger }  from '../../core/logger.js';
import { ProviderError } from '../../core/errors/app-error.js';
import { JOB_MAX_ATTEMPTS } from '../../config/constants.js';

const logger = createLogger('retry');

/** Errors that should NOT be retried. */
const NON_RETRIABLE_STATUSES = new Set([400, 401, 403, 404, 422]);

interface RetryOptions {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?:  number;
}

/**
 * Executes `fn` with exponential backoff + jitter on retriable errors.
 * Non-retriable HTTP errors (400, 401, 403, 404, 422) are thrown immediately.
 *
 * @param fn       Async function to execute
 * @param label    Human-readable label for logging (e.g. "getLiveMatches")
 * @param options  Retry configuration
 */
export async function withRetry<T>(
  fn:      () => Promise<T>,
  label:   string,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? JOB_MAX_ATTEMPTS;
  const baseDelay   = options.baseDelayMs ?? 1000;
  const maxDelay    = options.maxDelayMs  ?? 30_000;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry non-retriable HTTP status errors
      if (err instanceof ProviderError) {
        const status = extractHttpStatus(err);
        if (status !== null && NON_RETRIABLE_STATUSES.has(status)) {
          logger.warn({ label, attempt, status }, 'Non-retriable provider error — not retrying');
          throw err;
        }
      }

      if (attempt === maxAttempts) break;

      // Exponential backoff with full jitter: random(0, min(cap, base * 2^attempt))
      const exponential = Math.min(maxDelay, baseDelay * 2 ** (attempt - 1));
      const jitter      = Math.random() * exponential;
      const delay       = Math.floor(jitter);

      logger.warn(
        { label, attempt, maxAttempts, delayMs: delay, err: lastError.message },
        'Provider call failed — retrying with backoff',
      );

      await sleep(delay);
    }
  }

  logger.error({ label, maxAttempts, err: lastError }, 'All retry attempts exhausted');
  throw lastError ?? new ProviderError('PROVIDER_UNAVAILABLE', `${label} failed after ${maxAttempts} attempts`);
}

function extractHttpStatus(err: ProviderError): number | null {
  // ProviderError.httpStatus is the HTTP code we return to clients
  // We use it as a proxy for the upstream HTTP status here
  return err.httpStatus ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
