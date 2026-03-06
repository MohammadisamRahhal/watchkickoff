import { z } from 'zod';

export const LeagueTypeSchema = z.enum(['LEAGUE', 'CUP', 'TOURNAMENT']);

export const LeagueSchema = z.object({
  id:             z.string().uuid(),
  name:           z.string().min(1).max(150),
  slug:           z.string().min(1).max(150),
  countryCode:    z.string().length(2),
  season:         z.string().min(4).max(10),
  type:           LeagueTypeSchema,
  coverageLevel:  z.number().int().min(1).max(3),
  isActive:       z.boolean(),
  createdAt:      z.coerce.date(),
  updatedAt:      z.coerce.date(),
});

export const LeagueSummarySchema = LeagueSchema.pick({
  id: true,
  name: true,
  slug: true,
  countryCode: true,
  season: true,
  type: true,
});

export type League        = z.infer<typeof LeagueSchema>;
export type LeagueSummary = z.infer<typeof LeagueSummarySchema>;
export type LeagueType    = z.infer<typeof LeagueTypeSchema>;
