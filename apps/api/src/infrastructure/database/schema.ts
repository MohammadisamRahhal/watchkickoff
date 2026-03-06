/**
 * Drizzle ORM schema definitions.
 *
 * This is the authoritative definition of all database tables.
 * TypeScript types for database rows are inferred from these definitions.
 * All column names use camelCase here; Drizzle maps to snake_case in SQL.
 *
 * No business logic here — schema definitions only.
 */
import {
  pgTable, pgEnum, uuid, varchar, char, smallint, integer,
  boolean, date, timestamp, jsonb, text, unique, index,
  numeric, primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const matchStatusEnum = pgEnum('match_status', [
  'SCHEDULED', 'PRE_MATCH', 'LIVE_1H', 'HALF_TIME',
  'LIVE_2H', 'EXTRA_TIME', 'PENALTIES', 'FINISHED',
  'POSTPONED', 'CANCELLED', 'SUSPENDED', 'AWARDED',
]);

export const leagueTypeEnum     = pgEnum('league_type',     ['LEAGUE', 'CUP', 'TOURNAMENT']);
export const playerPositionEnum = pgEnum('player_position', ['GK', 'DEF', 'MID', 'FWD']);
export const playerStatusEnum   = pgEnum('player_status',   ['ACTIVE', 'INJURED', 'SUSPENDED', 'INACTIVE']);
export const footTypeEnum       = pgEnum('foot_type',       ['LEFT', 'RIGHT', 'BOTH']);
export const transferTypeEnum   = pgEnum('transfer_type',   ['PAID', 'FREE', 'LOAN', 'LOAN_RETURN', 'LOAN_END']);
export const standingZoneEnum   = pgEnum('standing_zone',   ['PROMOTION', 'CHAMPIONSHIP', 'RELEGATION', 'NONE']);
export const eventTypeEnum      = pgEnum('event_type', [
  'GOAL', 'OWN_GOAL', 'YELLOW', 'SECOND_YELLOW', 'RED',
  'SUB_IN', 'SUB_OUT', 'VAR', 'PENALTY_SCORED', 'PENALTY_MISSED',
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const leagues = pgTable('leagues', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name:          varchar('name', { length: 150 }).notNull(),
  slug:          varchar('slug', { length: 150 }).notNull().unique(),
  countryCode:   char('country_code', { length: 2 }).notNull(),
  season:        varchar('season', { length: 10 }).notNull(),
  type:          leagueTypeEnum('type').notNull(),
  coverageLevel: smallint('coverage_level').default(1),
  isActive:      boolean('is_active').default(true),
  providerRef:   jsonb('provider_ref').default({}),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const teams = pgTable('teams', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name:         varchar('name', { length: 150 }).notNull(),
  slug:         varchar('slug', { length: 150 }).notNull().unique(),
  shortName:    varchar('short_name', { length: 50 }),
  crestUrl:     varchar('crest_url', { length: 500 }),
  countryCode:  char('country_code', { length: 2 }).notNull(),
  foundedYear:  smallint('founded_year'),
  stadiumName:  varchar('stadium_name', { length: 200 }),
  providerRef:  jsonb('provider_ref').default({}),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const leagueSeasons = pgTable('league_seasons', {
  leagueId: uuid('league_id').notNull().references(() => leagues.id),
  teamId:   uuid('team_id').notNull().references(() => teams.id),
  season:   varchar('season', { length: 10 }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.leagueId, t.teamId, t.season] }),
}));

export const players = pgTable('players', {
  id:              uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name:            varchar('name', { length: 200 }).notNull(),
  slug:            varchar('slug', { length: 200 }).notNull().unique(),
  nationalityCode: char('nationality_code', { length: 2 }),
  dateOfBirth:     date('date_of_birth'),
  heightCm:        smallint('height_cm'),
  preferredFoot:   footTypeEnum('preferred_foot'),
  position:        playerPositionEnum('position'),
  currentTeamId:   uuid('current_team_id').references(() => teams.id),
  status:          playerStatusEnum('status').notNull().default('ACTIVE'),
  providerRef:     jsonb('provider_ref').default({}),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const matches = pgTable('matches', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug:         varchar('slug', { length: 300 }).notNull().unique(),
  leagueId:     uuid('league_id').notNull().references(() => leagues.id),
  homeTeamId:   uuid('home_team_id').notNull().references(() => teams.id),
  awayTeamId:   uuid('away_team_id').notNull().references(() => teams.id),
  kickoffAt:    timestamp('kickoff_at', { withTimezone: true }).notNull(),
  status:       matchStatusEnum('status').notNull().default('SCHEDULED'),
  homeScore:    smallint('home_score').default(0),
  awayScore:    smallint('away_score').default(0),
  homeScoreHt:  smallint('home_score_ht'),
  awayScoreHt:  smallint('away_score_ht'),
  minute:       smallint('minute'),
  minuteExtra:  smallint('minute_extra'),
  season:       varchar('season', { length: 10 }).notNull(),
  round:        varchar('round', { length: 50 }),
  venue:        varchar('venue', { length: 200 }),
  providerRef:  jsonb('provider_ref').default({}),
  rawStatus:    varchar('raw_status', { length: 50 }),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // Partial index on live matches — only live status rows in the index.
  liveIdx:       index('idx_matches_live').on(t.status),
  kickoffIdx:    index('idx_matches_kickoff_date').on(t.kickoffAt, t.status),
  leagueIdx:     index('idx_matches_league_kickoff').on(t.leagueId, t.kickoffAt),
  homeTeamIdx:   index('idx_matches_home_team').on(t.homeTeamId, t.kickoffAt),
  awayTeamIdx:   index('idx_matches_away_team').on(t.awayTeamId, t.kickoffAt),
}));

export const matchEvents = pgTable('match_events', {
  id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  matchId:        uuid('match_id').notNull().references(() => matches.id),
  teamId:         uuid('team_id').notNull().references(() => teams.id),
  playerId:       uuid('player_id').references(() => players.id),
  assistPlayerId: uuid('assist_player_id').references(() => players.id),
  eventType:      eventTypeEnum('event_type').notNull(),
  minute:         smallint('minute').notNull(),
  minuteExtra:    smallint('minute_extra').default(0),
  detail:         varchar('detail', { length: 100 }),
  meta:           jsonb('meta').default({}),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  matchMinuteIdx: index('idx_events_match_minute').on(t.matchId, t.minute, t.minuteExtra),
}));

export const matchLineups = pgTable('match_lineups', {
  id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  matchId:        uuid('match_id').notNull().references(() => matches.id),
  teamId:         uuid('team_id').notNull().references(() => teams.id),
  playerId:       uuid('player_id').notNull().references(() => players.id),
  shirtNumber:    smallint('shirt_number'),
  positionCode:   varchar('position_code', { length: 10 }),
  formationSlot:  smallint('formation_slot'),
  isStarter:      boolean('is_starter').notNull(),
  isCaptain:      boolean('is_captain').default(false),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unq: unique('uq_lineup').on(t.matchId, t.teamId, t.playerId),
}));

export const standings = pgTable('standings', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  leagueId:     uuid('league_id').notNull().references(() => leagues.id),
  teamId:       uuid('team_id').notNull().references(() => teams.id),
  season:       varchar('season', { length: 10 }).notNull(),
  position:     smallint('position').notNull(),
  played:       smallint('played').default(0),
  wins:         smallint('wins').default(0),
  draws:        smallint('draws').default(0),
  losses:       smallint('losses').default(0),
  goalsFor:     smallint('goals_for').default(0),
  goalsAgainst: smallint('goals_against').default(0),
  points:       smallint('points').default(0),
  form:         varchar('form', { length: 10 }),
  zone:         standingZoneEnum('zone').notNull().default('NONE'),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unq:       unique('uq_standing').on(t.leagueId, t.teamId, t.season),
  leagueIdx: index('idx_standings_league_season').on(t.leagueId, t.season, t.position),
}));

export const seasonStats = pgTable('season_stats', {
  id:              uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  playerId:        uuid('player_id').notNull().references(() => players.id),
  teamId:          uuid('team_id').notNull().references(() => teams.id),
  leagueId:        uuid('league_id').notNull().references(() => leagues.id),
  season:          varchar('season', { length: 10 }).notNull(),
  goals:           smallint('goals').default(0),
  assists:         smallint('assists').default(0),
  appearances:     smallint('appearances').default(0),
  minutesPlayed:   integer('minutes_played').default(0),
  yellowCards:     smallint('yellow_cards').default(0),
  redCards:        smallint('red_cards').default(0),
  shotsTotal:      smallint('shots_total').default(0),
  shotsOnTarget:   smallint('shots_on_target').default(0),
  passesTotal:     integer('passes_total').default(0),
  passAccuracy:    numeric('pass_accuracy', { precision: 5, scale: 2 }),
  rating:          numeric('rating', { precision: 4, scale: 2 }),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unq:       unique('uq_season_stats').on(t.playerId, t.leagueId, t.season),
  playerIdx: index('idx_season_stats_player').on(t.playerId, t.season, t.leagueId),
}));

export const transfers = pgTable('transfers', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  playerId:     uuid('player_id').notNull().references(() => players.id),
  fromTeamId:   uuid('from_team_id').references(() => teams.id),
  toTeamId:     uuid('to_team_id').references(() => teams.id),
  transferDate: date('transfer_date').notNull(),
  feeAmount:    numeric('fee_amount', { precision: 12, scale: 2 }),
  feeCurrency:  char('fee_currency', { length: 3 }).default('EUR'),
  feeType:      transferTypeEnum('fee_type'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const providerRefs = pgTable('provider_refs', {
  entityType:   varchar('entity_type', { length: 30 }).notNull(),
  internalId:   uuid('internal_id').notNull(),
  providerName: varchar('provider_name', { length: 30 }).notNull(),
  externalId:   varchar('external_id', { length: 50 }).notNull(),
}, (t) => ({
  pk:          primaryKey({ columns: [t.entityType, t.providerName, t.externalId] }),
  reverseIdx:  index('idx_provider_refs_internal').on(t.entityType, t.internalId),
}));
