/**
 * Standings module — request/response Zod schemas.
 *
 * These schemas validate HTTP request parameters and shape API responses.
 * Separate from @watchkickoff/shared entity schemas — these are HTTP-layer concerns.
 */
import { z } from 'zod';

export const StandingsIdParamsSchema = z.object({
  id: z.string().uuid('Standings ID must be a valid UUID'),
});

export const StandingsSlugParamsSchema = z.object({
  slug: z.string().min(1).max(300),
});

export const PaginationQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
