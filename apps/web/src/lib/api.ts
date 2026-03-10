/**
 * Typed API client for WatchKickoff.
 *
 * All fetches go through this module so we have a single place to:
 * - Set the base URL (server env vs browser env)
 * - Add auth headers if needed in future phases
 * - Handle error responses consistently
 *
 * These functions run in React Server Components (no "use client").
 */

import type { MatchSummary, MatchDetail, League, StandingRow } from '@watchkickoff/shared';

/** Base URL for server-side fetches (server components, route handlers). */
const BASE = process.env.API_URL ?? 'http://localhost:3001';

// ── Generic fetch helper ────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}/api/v1${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    throw new Error(`API ${res.status} — ${path}`);
  }

  return res.json() as Promise<T>;
}

// ── Matches ─────────────────────────────────────────────────────

/** Today's matches — used on the home page. Revalidated every 60 s via ISR. */
export async function getTodayMatches(): Promise<MatchSummary[]> {
  return apiFetch<MatchSummary[]>('/matches/today', {
    next: { revalidate: 60 },
  });
}

/** Single match by slug — used on the match detail page. */
export async function getMatchBySlug(slug: string): Promise<MatchDetail> {
  const res = await apiFetch<{ data: any }>(`/matches/${slug}`, {
    next: { revalidate: 30 },
  });
  const d = (res as any).data ?? res;
  // Normalize to MatchDetail shape expected by the page
  return {
    ...d,
    homeTeamId:   d.homeTeam?.id,
    awayTeamId:   d.awayTeam?.id,
    homeScore:    d.score?.home ?? 0,
    awayScore:    d.score?.away ?? 0,
    homeScoreHt:  d.score?.homeHt ?? null,
    awayScoreHt:  d.score?.awayHt ?? null,
    events:       d.events ?? [],
  } as unknown as MatchDetail;
}

/** Live matches — short TTL, revalidated every 15 s. */
export async function getLiveMatches(): Promise<MatchSummary[]> {
  const res = await apiFetch<MatchSummary[] | { data: MatchSummary[] }>('/matches/live', {
    next: { revalidate: 15 },
  });
  return Array.isArray(res) ? res : (res as any).data ?? [];
}

// ── Leagues ─────────────────────────────────────────────────────

/** All active leagues. Revalidated hourly. */
export async function getLeagues(): Promise<League[]> {
  return apiFetch<League[]>('/leagues', {
    next: { revalidate: 3600 },
  });
}

/** Single league by slug. */
export async function getLeagueBySlug(slug: string): Promise<League> {
  return apiFetch<League>(`/leagues/${slug}`, {
    next: { revalidate: 3600 },
  });
}

/** Fixtures for a league. */
export async function getLeagueMatches(slug: string): Promise<MatchSummary[]> {
  return apiFetch<MatchSummary[]>(`/leagues/${slug}/matches`, {
    next: { revalidate: 300 },
  });
}

// ── Standings ────────────────────────────────────────────────────

/** Standings table for a league. */
export async function getStandings(leagueSlug: string): Promise<StandingRow[]> {
  return apiFetch<StandingRow[]>(`/leagues/${leagueSlug}/standings`, {
    next: { revalidate: 300 },
  });
}

// ── Teams ─────────────────────────────────────────────────────

export async function getTeamBySlug(slug: string) {
  return apiFetch<any>(`/teams/${slug}`, { next: { revalidate: 900 } });
}

export async function getTeamMatches(slug: string) {
  return apiFetch<any[]>(`/teams/${slug}/matches`, { next: { revalidate: 300 } });
}

export async function getTeamStandings(slug: string) {
  return apiFetch<any[]>(`/teams/${slug}/standings`, { next: { revalidate: 300 } });
}

export async function getTeamSquad(slug: string) {
  return apiFetch<any[]>(`/teams/${slug}/squad`, { next: { revalidate: 900 } });
}

// ── Players ───────────────────────────────────────────────────

export async function getPlayerBySlug(slug: string) {
  return apiFetch<any>(`/players/${slug}`, { next: { revalidate: 900 } });
}

export async function getPlayerStats(slug: string) {
  return apiFetch<any[]>(`/players/${slug}/stats`, { next: { revalidate: 900 } });
}

// ── Search ────────────────────────────────────────────────────

export async function searchAll(q: string) {
  return apiFetch<{ teams: any[]; leagues: any[]; players: any[] }>(
    `/search?q=${encodeURIComponent(q)}`,
    { next: { revalidate: 60 } },
  );
}

export async function getMatchLineups(slug: string) {
  return apiFetch<any[]>(`/matches/${slug}/lineups`, { next: { revalidate: 300 } });
}

export async function getLeagueScorers(slug: string) {
  return apiFetch<any[]>(`/leagues/${slug}/scorers`, { next: { revalidate: 3600 } });
}

