import { z } from 'zod';

export const StandingZoneSchema = z.enum(['PROMOTION', 'CHAMPIONSHIP', 'RELEGATION', 'NONE']);

export const StandingRowSchema = z.object({
  id:           z.string().uuid(),
  leagueId:     z.string().uuid(),
  teamId:       z.string().uuid(),
  season:       z.string().min(4).max(10),
  position:     z.number().int().min(1),
  played:       z.number().int().min(0),
  wins:         z.number().int().min(0),
  draws:        z.number().int().min(0),
  losses:       z.number().int().min(0),
  goalsFor:     z.number().int().min(0),
  goalsAgainst: z.number().int().min(0),
  goalDiff:     z.number().int(),
  points:       z.number().int().min(0),
  form:         z.string().max(10).nullable(),
  zone:         StandingZoneSchema,
  updatedAt:    z.coerce.date(),
});

export type StandingRow  = z.infer<typeof StandingRowSchema>;
export type StandingZone = z.infer<typeof StandingZoneSchema>;
