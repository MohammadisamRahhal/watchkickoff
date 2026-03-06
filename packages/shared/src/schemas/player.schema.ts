import { z } from 'zod';

export const PlayerPositionSchema = z.enum(['GK', 'DEF', 'MID', 'FWD']);
export const FootTypeSchema        = z.enum(['LEFT', 'RIGHT', 'BOTH']);
export const PlayerStatusSchema    = z.enum(['ACTIVE', 'INJURED', 'SUSPENDED', 'INACTIVE']);

export const PlayerSchema = z.object({
  id:              z.string().uuid(),
  name:            z.string().min(1).max(200),
  slug:            z.string().min(1).max(200),
  nationalityCode: z.string().length(2).nullable(),
  dateOfBirth:     z.coerce.date().nullable(),
  heightCm:        z.number().int().min(100).max(250).nullable(),
  preferredFoot:   FootTypeSchema.nullable(),
  position:        PlayerPositionSchema.nullable(),
  currentTeamId:   z.string().uuid().nullable(),
  status:          PlayerStatusSchema,
  createdAt:       z.coerce.date(),
  updatedAt:       z.coerce.date(),
});

export const PlayerSummarySchema = PlayerSchema.pick({
  id: true,
  name: true,
  slug: true,
  position: true,
  currentTeamId: true,
  status: true,
});

export type Player         = z.infer<typeof PlayerSchema>;
export type PlayerSummary  = z.infer<typeof PlayerSummarySchema>;
export type PlayerPosition = z.infer<typeof PlayerPositionSchema>;
export type FootType       = z.infer<typeof FootTypeSchema>;
export type PlayerStatus   = z.infer<typeof PlayerStatusSchema>;
