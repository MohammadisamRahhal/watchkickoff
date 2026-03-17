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
    parameters: z.union([z.record(z.unknown()), z.array(z.unknown())]),
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
  id:     z.number().nullable(),
  name:   z.string().nullable(),
  logo:   z.string().nullable().optional(),
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
    round:   z.string().nullable().optional(),
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

// ── Players response ───────────────────────────────────────────────────────

export const ApiPlayerStatisticsSchema = z.object({
  team: z.object({
    id:   z.number().nullable(),
    name: z.string().nullable(),
    logo: z.string().nullable().optional(),
  }),
  league: z.object({
    id:     z.number().nullable(),
    name:   z.string().nullable(),
    season: z.number().nullable(),
  }),
  games: z.object({
    appearences:  z.number().nullable().optional(),
    lineups:      z.number().nullable().optional(),
    minutes:      z.number().nullable().optional(),
    position:     z.string().nullable().optional(),
    rating:       z.string().nullable().optional(),
  }),
  goals: z.object({
    total:   z.number().nullable().optional(),
    assists: z.number().nullable().optional(),
  }),
  cards: z.object({
    yellow: z.number().nullable().optional(),
    red:    z.number().nullable().optional(),
  }),
  shots: z.object({
    total: z.number().nullable().optional(),
    on:    z.number().nullable().optional(),
  }).optional(),
  passes: z.object({
    total:    z.number().nullable().optional(),
    accuracy: z.number().nullable().optional(),
  }).optional(),
});

export const ApiPlayerSchema = z.object({
  player: z.object({
    id:          z.number(),
    name:        z.string(),
    firstname:   z.string().nullable().optional(),
    lastname:    z.string().nullable().optional(),
    age:         z.number().nullable().optional(),
    birth: z.object({
      date:    z.string().nullable().optional(),
      place:   z.string().nullable().optional(),
      country: z.string().nullable().optional(),
    }).optional(),
    nationality: z.string().nullable().optional(),
    height:      z.string().nullable().optional(),
    weight:      z.string().nullable().optional(),
    photo:       z.string().nullable().optional(),
  }),
  statistics: z.array(ApiPlayerStatisticsSchema),
});

export const ApiPlayersResponseSchema = ApiResponseWrapper(ApiPlayerSchema);

// ── Lineups response ───────────────────────────────────────────────────────

export const ApiLineupPlayerSchema = z.object({
  id:     z.number().nullable().optional(),
  name:   z.string().nullable().optional(),
  number: z.number().nullable().optional(),
  pos:    z.string().nullable().optional(),
  grid:   z.string().nullable().optional(),
});

export const ApiLineupSchema = z.object({
  team: z.object({
    id:     z.number(),
    name:   z.string(),
    logo:   z.string().optional(),
    colors: z.any().optional(),
  }),
  formation: z.string().nullable().optional(),
  startXI:   z.array(z.object({ player: ApiLineupPlayerSchema })).optional().default([]),
  substitutes: z.array(z.object({ player: ApiLineupPlayerSchema })).optional().default([]),
  coach: z.object({
    id:   z.number().nullable().optional(),
    name: z.string().nullable().optional(),
    photo: z.string().nullable().optional(),
  }).optional(),
});

export const ApiLineupsResponseSchema = ApiResponseWrapper(ApiLineupSchema);

// ── Top Scorers response — same shape as players ───────────────────────────
export const ApiTopScorersResponseSchema = ApiPlayersResponseSchema;

// Export inferred types
export type ApiPlayer           = z.infer<typeof ApiPlayerSchema>;
export type ApiPlayerStatistics = z.infer<typeof ApiPlayerStatisticsSchema>;
export type ApiLineup           = z.infer<typeof ApiLineupSchema>;
export type ApiLineupPlayer     = z.infer<typeof ApiLineupPlayerSchema>;
