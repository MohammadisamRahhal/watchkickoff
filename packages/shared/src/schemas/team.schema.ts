import { z } from 'zod';

export const TeamSchema = z.object({
  id:           z.string().uuid(),
  name:         z.string().min(1).max(150),
  slug:         z.string().min(1).max(150),
  shortName:    z.string().max(50).nullable(),
  crestUrl:     z.string().url().nullable(),
  countryCode:  z.string().length(2),
  foundedYear:  z.number().int().min(1800).max(2100).nullable(),
  stadiumName:  z.string().max(200).nullable(),
  createdAt:    z.coerce.date(),
  updatedAt:    z.coerce.date(),
});

export const TeamSummarySchema = TeamSchema.pick({
  id: true,
  name: true,
  slug: true,
  shortName: true,
  crestUrl: true,
  countryCode: true,
});

export type Team        = z.infer<typeof TeamSchema>;
export type TeamSummary = z.infer<typeof TeamSummarySchema>;
