/**
 * API-Football response normalizer.
 *
 * Maps API-Football's response shapes to WatchKickoff's internal types.
 * THIS IS THE ONLY FILE THAT KNOWS API-FOOTBALL'S FIELD NAMES.
 *
 * Rules:
 * - Input: validated API-Football types (from schemas.ts)
 * - Output: internal canonical types (from @watchkickoff/shared)
 * - No I/O — pure transformation functions, fully unit testable
 * - Unknown status codes: mapped to SCHEDULED with a warn log
 */
import { createLogger } from '@core/logger.js';
import type { ApiFixture, ApiEvent, ApiStandingEntry } from './schemas.js';
import type { NormalizedEvent, NormalizedMatchStat, ProviderFixture } from '../IFootballProvider.js';
import { MATCH_STATUS } from '@watchkickoff/shared';
import { EVENT_TYPE } from '@watchkickoff/shared';
import type { MatchStatus, EventType } from '@watchkickoff/shared';

const logger = createLogger('api-football-normalizer');

// ── Match status mapping ───────────────────────────────────────────────────

const STATUS_MAP: Record<string, MatchStatus | undefined> = {
  'TBD':  MATCH_STATUS.SCHEDULED,
  'NS':   MATCH_STATUS.SCHEDULED,
  '1H':   MATCH_STATUS.LIVE_1H,
  'HT':   MATCH_STATUS.HALF_TIME,
  '2H':   MATCH_STATUS.LIVE_2H,
  'ET':   MATCH_STATUS.EXTRA_TIME,
  'BT':   MATCH_STATUS.EXTRA_TIME,
  'P':    MATCH_STATUS.PENALTIES,
  'SUSP': MATCH_STATUS.SUSPENDED,
  'INT':  MATCH_STATUS.SUSPENDED,
  'FT':   MATCH_STATUS.FINISHED,
  'AET':  MATCH_STATUS.FINISHED,
  'PEN':  MATCH_STATUS.FINISHED,
  'PST':  MATCH_STATUS.POSTPONED,
  'CANC': MATCH_STATUS.CANCELLED,
  'ABD':  MATCH_STATUS.CANCELLED,
  'AWD':  MATCH_STATUS.AWARDED,
  'WO':   MATCH_STATUS.AWARDED,
  'LIVE': MATCH_STATUS.LIVE_1H,
};

export function normalizeMatchStatus(rawStatus: string): MatchStatus {
  const mapped = STATUS_MAP[rawStatus.toUpperCase()];
  if (mapped === undefined) {
    logger.warn({ rawStatus }, 'Unknown provider status — defaulting to SCHEDULED');
    return MATCH_STATUS.SCHEDULED;
  }
  return mapped;
}

// ── Event type mapping ─────────────────────────────────────────────────────

function normalizeEventType(type: string, detail: string): EventType {
  const typeUpper   = type.toUpperCase();
  const detailUpper = detail.toUpperCase();

  if (typeUpper === 'GOAL') {
    if (detailUpper.includes('OWN'))     return EVENT_TYPE.OWN_GOAL;
    if (detailUpper.includes('PENALTY') || detailUpper.includes('PEN'))
                                          return EVENT_TYPE.PENALTY_SCORED;
    return EVENT_TYPE.GOAL;
  }
  if (typeUpper === 'CARD') {
    if (detailUpper.includes('RED')) {
      return detailUpper.includes('SECOND') ? EVENT_TYPE.SECOND_YELLOW : EVENT_TYPE.RED;
    }
    return EVENT_TYPE.YELLOW;
  }
  if (typeUpper === 'SUBST') return EVENT_TYPE.SUB_IN;
  if (typeUpper === 'VAR') {
    if (detailUpper.includes('PENALTY MISSED')) return EVENT_TYPE.PENALTY_MISSED;
    return EVENT_TYPE.VAR;
  }

  logger.warn({ type, detail }, 'Unknown provider event type — defaulting to VAR');
  return EVENT_TYPE.VAR;
}

// ── Fixture normalization ──────────────────────────────────────────────────

export function normalizeFixture(raw: ApiFixture): ProviderFixture {
  const status = normalizeMatchStatus(raw.fixture.status.short);

  return {
    externalId:         String(raw.fixture.id),
    externalLeagueId:   String(raw.league.id),
    externalHomeTeamId: String(raw.teams.home.id),
    externalAwayTeamId: String(raw.teams.away.id),
    kickoffAt:          new Date(raw.fixture.timestamp * 1000),
    status,
    homeScore:          raw.goals.home ?? 0,
    awayScore:          raw.goals.away ?? 0,
    season:             String(raw.league.season),
    round:              raw.league.round,
    venue:              raw.fixture.venue?.name ?? undefined,
    rawStatus:          raw.fixture.status.short,
    minute:             raw.fixture.status.elapsed ?? null,
  };
}

// ── Event normalization ────────────────────────────────────────────────────

export function normalizeEvent(
  raw: ApiEvent,
  externalMatchId: string,
): NormalizedEvent {
  return {
    externalMatchId,
    externalTeamId:   String(raw.team.id),
    externalPlayerId: raw.player.id != null ? String(raw.player.id) : undefined,
    externalAssistId: raw.assist?.id != null ? String(raw.assist.id) : undefined,
    playerName:       raw.player?.name ?? undefined,
    assistName:       raw.assist?.name ?? undefined,
    eventType:        normalizeEventType(raw.type, raw.detail),
    minute:           raw.time.elapsed,
    minuteExtra:      raw.time.extra ?? 0,
    detail:           raw.detail,
  };
}

// ── Standing normalization ─────────────────────────────────────────────────

export function normalizeStandingZone(description: string | null | undefined): string {
  if (!description) return 'NONE';
  const d = description.toLowerCase();
  if (d.includes('promotion') || d.includes('champions league')) return 'PROMOTION';
  if (d.includes('playoff')   || d.includes('europa'))           return 'CHAMPIONSHIP';
  if (d.includes('relegation'))                                   return 'RELEGATION';
  return 'NONE';
}

export function normalizeStandingEntry(
  raw:              ApiStandingEntry,
  leagueExternalId: string,
  season:           string,
): {
  externalTeamId:   string;
  leagueExternalId: string;
  season:           string;
  data: Omit<NormalizedStandingData, 'leagueId' | 'teamId' | 'id'>;
} {
  return {
    externalTeamId: String(raw.team.id),
    leagueExternalId,
    season,
    data: {
      position:     raw.rank,
      played:       raw.all.played,
      wins:         raw.all.win,
      draws:        raw.all.draw,
      losses:       raw.all.lose,
      goalsFor:     raw.all.goals.for,
      goalsAgainst: raw.all.goals.against,
      goalDiff:     raw.goalsDiff,
      points:       raw.points,
      form:         raw.form ?? null,
      zone:         normalizeStandingZone(raw.description),
    },
  };
}

interface NormalizedStandingData {
  leagueId:     string;
  teamId:       string;
  position:     number;
  played:       number;
  wins:         number;
  draws:        number;
  losses:       number;
  goalsFor:     number;
  goalsAgainst: number;
  goalDiff:     number;
  points:       number;
  form:         string | null;
  zone:         string;
}

// Export the NormalizedMatchStat type alias so it's accessible in this module.
export type { NormalizedMatchStat };

// ── Player normalization ───────────────────────────────────────────────────

import type { ApiPlayer, ApiLineup } from './schemas.js';

export interface NormalizedPlayer {
  externalId:      string;
  name:            string;
  slug:            string;
  nationalityCode: string | null;
  dateOfBirth:     Date | null;
  heightCm:        number | null;
  photoUrl:        string | null;
  position:        string | null;
  externalTeamId:  string | null;
}

export interface NormalizedLineupEntry {
  externalTeamId: string;
  externalPlayerId: string;
  playerName:     string;
  shirtNumber:    number | null;
  positionCode:   string | null;
  formationSlot:  number | null;
  isStarter:      boolean;
  isCaptain:      boolean;
}

export interface NormalizedTopScorer {
  externalPlayerId: string;
  playerName:       string;
  externalTeamId:   string;
  externalLeagueId: string;
  season:           string;
  goals:            number;
  assists:          number;
  appearances:      number;
  minutesPlayed:    number;
  yellowCards:      number;
  redCards:         number;
  shotsTotal:       number;
  shotsOnTarget:    number;
  passesTotal:      number;
  passAccuracy:     number | null;
  rating:           number | null;
}

function makePlayerSlug(externalId: string, name: string): string {
  return `player-${externalId}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50)}`;
}

function parseHeightCm(height: string | null | undefined): number | null {
  if (!height) return null;
  const m = height.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function parseNationalityCode(nat: string | null | undefined): string | null {
  if (!nat) return null;
  // API returns full country name — store first 2 chars as placeholder
  return nat.slice(0, 2).toUpperCase();
}

export function normalizePlayer(raw: ApiPlayer): NormalizedPlayer {
  const stat = raw.statistics[0];
  return {
    externalId:      String(raw.player.id),
    name:            raw.player.name,
    slug:            makePlayerSlug(String(raw.player.id), raw.player.name),
    nationalityCode: parseNationalityCode(raw.player.nationality),
    dateOfBirth:     raw.player.birth?.date ? new Date(raw.player.birth.date) : null,
    heightCm:        parseHeightCm(raw.player.height),
    photoUrl:        raw.player.photo ?? null,
    position:        stat?.games?.position ?? null,
    externalTeamId:  stat ? String(stat.team.id) : null,
  };
}

export function normalizeLineup(raw: ApiLineup): NormalizedLineupEntry[] {
  const entries: NormalizedLineupEntry[] = [];
  const externalTeamId = String(raw.team.id);

  for (const { player } of raw.startXI) {
    entries.push({
      externalTeamId,
      externalPlayerId: String(player.id),
      playerName:       player.name,
      shirtNumber:      player.number ?? null,
      positionCode:     player.pos ?? null,
      formationSlot:    player.grid ? parseInt(player.grid.split(':')[0], 10) : null,
      isStarter:        true,
      isCaptain:        false,
    });
  }

  for (const { player } of raw.substitutes) {
    entries.push({
      externalTeamId,
      externalPlayerId: String(player.id),
      playerName:       player.name,
      shirtNumber:      player.number ?? null,
      positionCode:     player.pos ?? null,
      formationSlot:    null,
      isStarter:        false,
      isCaptain:        false,
    });
  }

  return entries;
}

export function normalizeTopScorer(raw: ApiPlayer): NormalizedTopScorer | null {
  const stat = raw.statistics[0];
  if (!stat) return null;
  return {
    externalPlayerId: String(raw.player.id),
    playerName:       raw.player.name,
    externalTeamId:   String(stat.team.id),
    externalLeagueId: String(stat.league.id),
    season:           String(stat.league.season),
    goals:            stat.goals.total ?? 0,
    assists:          stat.goals.assists ?? 0,
    appearances:      stat.games.appearences ?? 0,
    minutesPlayed:    stat.games.minutes ?? 0,
    yellowCards:      stat.cards.yellow ?? 0,
    redCards:         stat.cards.red ?? 0,
    shotsTotal:       stat.shots?.total ?? 0,
    shotsOnTarget:    stat.shots?.on ?? 0,
    passesTotal:      stat.passes?.total ?? 0,
    passAccuracy:     stat.passes?.accuracy ?? null,
    rating:           stat.games.rating ? parseFloat(stat.games.rating) : null,
  };
}
