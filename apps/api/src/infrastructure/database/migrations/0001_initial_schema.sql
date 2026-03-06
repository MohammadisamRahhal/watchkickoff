-- =============================================================================
-- Migration 0001: Initial schema
-- WatchKickoff — Phase 1
-- Compatible with: PostgreSQL 14.20+
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
-- pg_trgm: trigram similarity for full-text search on names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- ENUMs
-- ---------------------------------------------------------------------------
CREATE TYPE match_status AS ENUM (
  'SCHEDULED',
  'PRE_MATCH',
  'LIVE_1H',
  'HALF_TIME',
  'LIVE_2H',
  'EXTRA_TIME',
  'PENALTIES',
  'FINISHED',
  'POSTPONED',
  'CANCELLED',
  'SUSPENDED',
  'AWARDED'
);

CREATE TYPE league_type AS ENUM (
  'LEAGUE',
  'CUP',
  'TOURNAMENT'
);

CREATE TYPE player_position AS ENUM (
  'GK',
  'DEF',
  'MID',
  'FWD'
);

CREATE TYPE player_status AS ENUM (
  'ACTIVE',
  'INJURED',
  'SUSPENDED',
  'INACTIVE'
);

CREATE TYPE foot_type AS ENUM (
  'LEFT',
  'RIGHT',
  'BOTH'
);

CREATE TYPE transfer_type AS ENUM (
  'PAID',
  'FREE',
  'LOAN',
  'LOAN_RETURN',
  'LOAN_END'
);

CREATE TYPE standing_zone AS ENUM (
  'PROMOTION',
  'CHAMPIONSHIP',
  'RELEGATION',
  'NONE'
);

CREATE TYPE event_type AS ENUM (
  'GOAL',
  'OWN_GOAL',
  'YELLOW',
  'SECOND_YELLOW',
  'RED',
  'SUB_IN',
  'SUB_OUT',
  'VAR',
  'PENALTY_SCORED',
  'PENALTY_MISSED'
);

-- ---------------------------------------------------------------------------
-- leagues
-- ---------------------------------------------------------------------------
CREATE TABLE leagues (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(150) NOT NULL,
  slug           VARCHAR(150) NOT NULL UNIQUE,
  country_code   CHAR(2)     NOT NULL,
  season         VARCHAR(10) NOT NULL,
  type           league_type NOT NULL,
  coverage_level SMALLINT    NOT NULL DEFAULT 1,
  provider_ref   JSONB       NOT NULL DEFAULT '{}',
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------------
CREATE TABLE teams (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150) NOT NULL,
  slug          VARCHAR(150) NOT NULL UNIQUE,
  short_name    VARCHAR(50),
  crest_url     VARCHAR(500),
  country_code  CHAR(2)     NOT NULL,
  founded_year  SMALLINT,
  stadium_name  VARCHAR(200),
  provider_ref  JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- league_seasons (team membership per season)
-- ---------------------------------------------------------------------------
CREATE TABLE league_seasons (
  league_id UUID        NOT NULL REFERENCES leagues(id),
  team_id   UUID        NOT NULL REFERENCES teams(id),
  season    VARCHAR(10) NOT NULL,
  PRIMARY KEY (league_id, team_id, season)
);

-- ---------------------------------------------------------------------------
-- players
-- ---------------------------------------------------------------------------
CREATE TABLE players (
  id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(200)    NOT NULL,
  slug             VARCHAR(200)    NOT NULL UNIQUE,
  nationality_code CHAR(2),
  date_of_birth    DATE,
  height_cm        SMALLINT,
  preferred_foot   foot_type,
  position         player_position,
  current_team_id  UUID            REFERENCES teams(id),
  status           player_status   NOT NULL DEFAULT 'ACTIVE',
  provider_ref     JSONB           NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
CREATE TABLE matches (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(300) NOT NULL UNIQUE,
  league_id     UUID         NOT NULL REFERENCES leagues(id),
  home_team_id  UUID         NOT NULL REFERENCES teams(id),
  away_team_id  UUID         NOT NULL REFERENCES teams(id),
  kickoff_at    TIMESTAMPTZ  NOT NULL,
  status        match_status NOT NULL DEFAULT 'SCHEDULED',
  home_score    SMALLINT     NOT NULL DEFAULT 0,
  away_score    SMALLINT     NOT NULL DEFAULT 0,
  home_score_ht SMALLINT,
  away_score_ht SMALLINT,
  minute        SMALLINT,
  minute_extra  SMALLINT,
  season        VARCHAR(10)  NOT NULL,
  round         VARCHAR(50),
  venue         VARCHAR(200),
  provider_ref  JSONB        NOT NULL DEFAULT '{}',
  raw_status    VARCHAR(50),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- match_events
-- ---------------------------------------------------------------------------
CREATE TABLE match_events (
  id               UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         UUID       NOT NULL REFERENCES matches(id),
  team_id          UUID       NOT NULL REFERENCES teams(id),
  player_id        UUID       REFERENCES players(id),
  assist_player_id UUID       REFERENCES players(id),
  event_type       event_type NOT NULL,
  minute           SMALLINT   NOT NULL,
  minute_extra     SMALLINT   NOT NULL DEFAULT 0,
  detail           VARCHAR(100),
  meta             JSONB      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- match_lineups
-- ---------------------------------------------------------------------------
CREATE TABLE match_lineups (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       UUID    NOT NULL REFERENCES matches(id),
  team_id        UUID    NOT NULL REFERENCES teams(id),
  player_id      UUID    NOT NULL REFERENCES players(id),
  shirt_number   SMALLINT,
  position_code  VARCHAR(10),
  formation_slot SMALLINT,
  is_starter     BOOLEAN NOT NULL,
  is_captain     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, team_id, player_id)
);

-- ---------------------------------------------------------------------------
-- standings
-- ---------------------------------------------------------------------------
CREATE TABLE standings (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id     UUID          NOT NULL REFERENCES leagues(id),
  team_id       UUID          NOT NULL REFERENCES teams(id),
  season        VARCHAR(10)   NOT NULL,
  position      SMALLINT      NOT NULL,
  played        SMALLINT      NOT NULL DEFAULT 0,
  wins          SMALLINT      NOT NULL DEFAULT 0,
  draws         SMALLINT      NOT NULL DEFAULT 0,
  losses        SMALLINT      NOT NULL DEFAULT 0,
  goals_for     SMALLINT      NOT NULL DEFAULT 0,
  goals_against SMALLINT      NOT NULL DEFAULT 0,
  -- Generated column: PostgreSQL 12+ (PG 14 compatible)
  goal_diff     SMALLINT      GENERATED ALWAYS AS (goals_for - goals_against) STORED,
  points        SMALLINT      NOT NULL DEFAULT 0,
  form          VARCHAR(10),
  zone          standing_zone NOT NULL DEFAULT 'NONE',
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, team_id, season)
);

-- ---------------------------------------------------------------------------
-- season_stats
-- ---------------------------------------------------------------------------
CREATE TABLE season_stats (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID        NOT NULL REFERENCES players(id),
  team_id         UUID        NOT NULL REFERENCES teams(id),
  league_id       UUID        NOT NULL REFERENCES leagues(id),
  season          VARCHAR(10) NOT NULL,
  goals           SMALLINT    NOT NULL DEFAULT 0,
  assists         SMALLINT    NOT NULL DEFAULT 0,
  appearances     SMALLINT    NOT NULL DEFAULT 0,
  minutes_played  INTEGER     NOT NULL DEFAULT 0,
  yellow_cards    SMALLINT    NOT NULL DEFAULT 0,
  red_cards       SMALLINT    NOT NULL DEFAULT 0,
  shots_total     SMALLINT    NOT NULL DEFAULT 0,
  shots_on_target SMALLINT    NOT NULL DEFAULT 0,
  passes_total    INTEGER     NOT NULL DEFAULT 0,
  pass_accuracy   NUMERIC(5,2),
  rating          NUMERIC(4,2),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, league_id, season)
);

-- ---------------------------------------------------------------------------
-- transfers
-- ---------------------------------------------------------------------------
CREATE TABLE transfers (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     UUID          NOT NULL REFERENCES players(id),
  from_team_id  UUID          REFERENCES teams(id),
  to_team_id    UUID          REFERENCES teams(id),
  transfer_date DATE          NOT NULL,
  fee_amount    NUMERIC(12,2),
  fee_currency  CHAR(3)       NOT NULL DEFAULT 'EUR',
  fee_type      transfer_type,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- provider_refs
-- ---------------------------------------------------------------------------
CREATE TABLE provider_refs (
  entity_type   VARCHAR(30) NOT NULL,
  internal_id   UUID        NOT NULL,
  provider_name VARCHAR(30) NOT NULL,
  external_id   VARCHAR(50) NOT NULL,
  PRIMARY KEY (entity_type, provider_name, external_id)
);
