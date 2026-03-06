/**
 * Zod schemas for API-Football v3 response shapes.
 *
 * These schemas validate every raw response from the provider
 * before any data is processed. If validation fails, a
 * PROVIDER_INVALID_RESPONSE error is thrown — no malformed
 * data ever reaches the database.
 *
 * Schemas reflect the actual API-Football v3 response structure.
 * They are intentionally permissive on optional fields (using .optional())
 * because the provider does not guarantee every field on every plan tier.
 */
import { z } from 'zod';

// ── Shared primitives ──────────────────────────────────────────────────────

const ApiResponseWrapper = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    get:        z.string(),
    parameters: z.record(z.unknown()),
    errors:     z.union([z.array(z.unknown()), z.record(z.unknown())]),
    results:    z.number(),
    paging:     z.object({ current: z.number(), total: z.number() }),
    response:   z.array(dataSchema),
  });

// ── Fixture / Match response ───────────────────────────────────────────────

export const ApiFixtureStatusSchema = z.object({
  long:    z.string(),
  short:   z.string(),
  elapsed: z.number().nullable().optional(),
  extra:   z.number().nullable().optional(),
});

export const ApiTeamRefSchema = z.object({
  id:     z.number(),
  name:   z.string(),
  logo:   z.string().optional(),
});

export const ApiGoalsSchema = z.object({
  home: z.number().nullable(),
  away: z.number().nullable(),
});

export const ApiFixtureSchema = z.object({
  fixture: z.object({
    id:        z.number(),
    referee:   z.string().nullable().optional(),
    timezone:  z.string().optional(),
    date:      z.string(),
    timestamp: z.number(),
    venue: z.object({
      id:   z.number().nullable().optional(),
      name: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
    }).optional(),
    status: ApiFixtureStatusSchema,
  }),
  league: z.object({
    id:      z.number(),
    name:    z.string(),
    country: z.string(),
    logo:    z.string().optional(),
    flag:    z.string().nullable().optional(),
    season:  z.number(),
    round:   z.string().optional(),
  }),
  teams: z.object({
    home: ApiTeamRefSchema,
    away: ApiTeamRefSchema,
  }),
  goals:    ApiGoalsSchema,
  score: z.object({
    halftime:  ApiGoalsSchema.optional(),
    fulltime:  ApiGoalsSchema.optional(),
    extratime: ApiGoalsSchema.nullable().optional(),
    penalty:   ApiGoalsSchema.nullable().optional(),
  }).optional(),
});

export const ApiFixturesResponseSchema = ApiResponseWrapper(ApiFixtureSchema);

// ── Match events response ──────────────────────────────────────────────────

export const ApiEventSchema = z.object({
  time: z.object({
    elapsed: z.number(),
    extra:   z.number().nullable().optional(),
  }),
  team: ApiTeamRefSchema,
  player: z.object({
    id:   z.number().nullable(),
    name: z.string().nullable(),
  }),
  assist: z.object({
    id:   z.number().nullable(),
    name: z.string().nullable(),
  }).optional(),
  type:   z.string(),
  detail: z.string(),
  comments: z.string().nullable().optional(),
});

export const ApiEventsResponseSchema = ApiResponseWrapper(ApiEventSchema);

// ── Standings response ─────────────────────────────────────────────────────

export const ApiStandingEntrySchema = z.object({
  rank:        z.number(),
  team:        ApiTeamRefSchema,
  points:      z.number(),
  goalsDiff:   z.number(),
  group:       z.string().optional(),
  form:        z.string().nullable().optional(),
  status:      z.string().optional(),
  description: z.string().nullable().optional(),
  all: z.object({
    played: z.number(),
    win:    z.number(),
    draw:   z.number(),
    lose:   z.number(),
    goals: z.object({ for: z.number(), against: z.number() }),
  }),
});

export const ApiStandingsResponseSchema = ApiResponseWrapper(
  z.object({
    league: z.object({
      id:        z.number(),
      name:      z.string(),
      country:   z.string(),
      season:    z.number(),
      standings: z.array(z.array(ApiStandingEntrySchema)),
    }),
  }),
);

// Export inferred types for use in the normalizer
export type ApiFixture        = z.infer<typeof ApiFixtureSchema>;
export type ApiEvent          = z.infer<typeof ApiEventSchema>;
export type ApiStandingEntry  = z.infer<typeof ApiStandingEntrySchema>;
