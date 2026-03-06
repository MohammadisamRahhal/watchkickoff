/**
 * BullMQ job data type definitions.
 *
 * Every job in the system has a typed data payload defined here.
 * Workers receive typed job.data — no casting, no any.
 */

/** Payload for a live match poll job — one job per active match. */
export interface LiveSyncJobData {
  /** Internal WatchKickoff match UUID. */
  matchId:      string;
  /** Provider-specific match ID — passed to the adapter. */
  externalId:   string;
  /** The league's internal ID — used to determine sync priority. */
  leagueId:     string;
}

/** Payload for a fixture sync job — fetches upcoming fixtures for a league. */
export interface FixtureSyncJobData {
  /** Internal league UUID to fetch fixtures for. */
  leagueId:     string;
  /** Provider-specific league ID. */
  externalLeagueId: string;
  /** Season string e.g. "2025-26". */
  season:       string;
  /** Number of days ahead to fetch fixtures for. Default: 14. */
  daysAhead?:   number;
}

/** Payload for a standings sync job. */
export interface StandingSyncJobData {
  /** Internal league UUID. */
  leagueId:         string;
  externalLeagueId: string;
  season:           string;
}

/** Payload for a fanout job — publishes match state change to Redis Pub/Sub. */
export interface FanoutJobData {
  matchId:    string;
  /** Serialized LiveMatchUpdate payload — already validated and normalized. */
  payload:    string;
  channels:   string[];
}

/** Payload for a Next.js ISR revalidation job. */
export interface RevalidationJobData {
  /** URL paths to revalidate e.g. ["/league/premier-league", "/team/arsenal"]. */
  paths: string[];
}
