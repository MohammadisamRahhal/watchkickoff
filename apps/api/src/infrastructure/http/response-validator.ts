/**
 * infrastructure/http/response-validator.ts
 *
 * Validates raw API-Football responses through Zod schemas.
 * Every response MUST pass through here before any data is used.
 *
 * If validation fails: logs the error at WARN level and throws ProviderError.
 * Never passes invalid data to the application layer.
 */

import { type ZodSchema, ZodError } from 'zod';
import { createLogger }             from '../../core/logger.js';
import { ProviderError }            from '../../core/errors/app-error.js';

const logger = createLogger('response-validator');

/**
 * Validates `data` against `schema`.
 * @throws {ProviderError} if validation fails
 */
export function validateProviderResponse<T>(
  schema:  ZodSchema<T>,
  data:    unknown,
  context: string,     // e.g. "getLiveMatches", "getFixtures"
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const summary = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');

    logger.warn(
      { context, issues: result.error.issues.length, summary },
      'Provider response failed validation',
    );

    throw new ProviderError(
      'PROVIDER_INVALID_RESPONSE',
      `Provider response for ${context} failed schema validation: ${summary}`,
      502,
    );
  }

  return result.data;
}
