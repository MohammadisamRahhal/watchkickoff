/**
 * @watchkickoff/shared
 *
 * Single source of truth for:
 * - Zod schemas (runtime validation + TypeScript inference)
 * - Inferred TypeScript types
 * - Domain constants (MatchStatus, EventType)
 *
 * Consumed by both apps/api and apps/web.
 * Never import from sub-paths — always import from '@watchkickoff/shared'.
 */
export * from './schemas/index';
export * from './types/index';
export * from './constants/index';
