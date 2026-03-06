import { z } from 'zod';

export const SearchQuerySchema = z.object({
  q:      z.string().min(2).max(100),
  type:   z.enum(['all', 'teams', 'players', 'leagues']).default('all'),
  limit:  z.coerce.number().int().min(1).max(20).default(10),
});
