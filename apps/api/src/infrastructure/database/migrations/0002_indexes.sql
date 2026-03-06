-- =============================================================================
-- Migration 0002: Indexes
-- WatchKickoff — Phase 1
-- Compatible with: PostgreSQL 14.20+
--
-- Separated from table creation so indexes can be added/dropped independently
-- without altering table definitions.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- matches — primary access patterns
-- ---------------------------------------------------------------------------

-- Live match lookup: partial index on live statuses only.
-- Keeps the index small — only rows currently LIVE are indexed.
CREATE INDEX idx_matches_live
  ON matches (status, updated_at)
  WHERE status IN ('LIVE_1H', 'HALF_TIME', 'LIVE_2H', 'EXTRA_TIME', 'PENALTIES');

-- Today's fixtures by UTC date (home page primary query)
CREATE INDEX idx_matches_kickoff_date
  ON matches (DATE(kickoff_at AT TIME ZONE 'UTC'), status, kickoff_at);

-- League fixture list (ordered by kickoff)
CREATE INDEX idx_matches_league_kickoff
  ON matches (league_id, kickoff_at DESC);

-- Team fixture lookup — both home and away
CREATE INDEX idx_matches_home_team ON matches (home_team_id, kickoff_at);
CREATE INDEX idx_matches_away_team ON matches (away_team_id, kickoff_at);

-- ---------------------------------------------------------------------------
-- match_events
-- ---------------------------------------------------------------------------

-- Primary access pattern: all events for one match, ordered by time
CREATE INDEX idx_events_match_minute
  ON match_events (match_id, minute, minute_extra);

-- ---------------------------------------------------------------------------
-- standings
-- ---------------------------------------------------------------------------

-- Primary access: league + season, ordered by position
CREATE INDEX idx_standings_league_season
  ON standings (league_id, season, position);

-- ---------------------------------------------------------------------------
-- season_stats
-- ---------------------------------------------------------------------------

-- Player stats lookup
CREATE INDEX idx_season_stats_player
  ON season_stats (player_id, season, league_id);

-- Top scorers per league per season
CREATE INDEX idx_season_stats_league_goals
  ON season_stats (league_id, season, goals DESC);

-- ---------------------------------------------------------------------------
-- provider_refs
-- ---------------------------------------------------------------------------

-- Reverse lookup: internal UUID → external provider ID
CREATE INDEX idx_provider_refs_internal
  ON provider_refs (entity_type, internal_id);

-- ---------------------------------------------------------------------------
-- Full-text search — trigram indexes (requires pg_trgm extension from 0001)
-- ---------------------------------------------------------------------------
CREATE INDEX idx_teams_name_trgm
  ON teams USING gin (name gin_trgm_ops);

CREATE INDEX idx_players_name_trgm
  ON players USING gin (name gin_trgm_ops);

CREATE INDEX idx_leagues_name_trgm
  ON leagues USING gin (name gin_trgm_ops);
