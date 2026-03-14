/**
 * Leagues queries — ALL SQL for the leagues module lives here.
 */
import { db } from '@infrastructure/database/client.js';
import { sql } from 'drizzle-orm';
import { createLogger } from '@core/logger.js';

const logger = createLogger('leagues-queries');

export const leaguesQueries = {
  _logger: logger,

  async findAll() {
    const { rows } = await db.execute(sql`
      SELECT DISTINCT ON (regexp_replace(l.slug, '-[0-9]{4}-[0-9]{4}$', '')) l.*
      FROM leagues l
      WHERE l.is_active = true
      AND l.season IN ('2025', '2026')
      AND EXISTS (SELECT 1 FROM matches m WHERE m.league_id = l.id)
      ORDER BY regexp_replace(l.slug, '-[0-9]{4}-[0-9]{4}$', ''), l.season DESC
    `);
    return rows;
  },

  async findBySlug(slug: string) {
    const { rows } = await db.execute(sql`
      SELECT * FROM leagues WHERE slug = ${slug} LIMIT 1
    `);
    if (rows[0]) return rows[0] as any;
    const { rows: fuzzy } = await db.execute(sql`
      SELECT * FROM leagues
      WHERE slug ~ ('^' || ${slug} || '-[0-9]{4}-[0-9]{4}$')
         OR slug ~ ('^' || ${slug} || '-[a-z]{2,3}-[0-9]{4}-[0-9]{4}$')
      ORDER BY season DESC LIMIT 1
    `);
    return (fuzzy[0] as any) ?? null;
  },

  async findSeasonsByLeagueSlug(slug: string) {
    const { rows } = await db.execute(sql`
      SELECT DISTINCT l.season, l.slug
      FROM leagues l
      WHERE l.slug = ${slug}
         OR l.slug ~ ('^' || regexp_replace(${slug}, '-[0-9]{4}-[0-9]{4}$', '') || '-[0-9]{4}-[0-9]{4}$')
      ORDER BY l.season DESC
    `);
    return rows as any[];
  },

  async findRoundsByLeagueSlug(slug: string, season?: string) {
    const seasonFilter = season ? sql`AND m.season = ${season}` : sql`AND m.season = '2025'`;
    const { rows } = await db.execute(sql`
      SELECT DISTINCT m.round
      FROM matches m
      JOIN leagues l ON l.id = m.league_id
      WHERE (l.slug = ${slug}
         OR l.slug ~ ('^' || ${slug} || '-[0-9]{4}-[0-9]{4}$')
         OR l.slug ~ ('^' || ${slug} || '-[a-z]{2,3}-[0-9]{4}-[0-9]{4}$'))
        AND m.round IS NOT NULL
        ${seasonFilter}
      ORDER BY m.round
    `);
    return (rows as any[]).map(r => r.round).filter(Boolean);
  },

  async findMatchesByLeagueSlug(slug: string, season?: string, round?: string) {
    const seasonVal = season ?? '2025';
    const roundFilter = round ? sql`AND m.round = ${round}` : sql``;
    const { rows } = await db.execute(sql`
      SELECT
        m.id, m.slug, m.status, m.minute, m.kickoff_at,
        m.home_score, m.away_score, m.home_score_ht, m.away_score_ht,
        m.season, m.round, m.venue, m.raw_status,
        m.home_team_id, m.away_team_id, m.league_id,
        ht.id AS ht_id, ht.name AS ht_name, ht.crest_url AS ht_crest, ht.slug AS ht_slug,
        at.id AS at_id, at.name AS at_name, at.crest_url AS at_crest, at.slug AS at_slug,
        l.id  AS l_id,  l.name  AS l_name,  l.country_code AS l_country, l.slug AS l_slug
      FROM matches m
      JOIN teams ht  ON ht.id = m.home_team_id
      JOIN teams at  ON at.id = m.away_team_id
      JOIN leagues l ON l.id  = m.league_id
      WHERE (l.slug = ${slug}
         OR l.slug ~ ('^' || ${slug} || '-[0-9]{4}-[0-9]{4}$')
         OR l.slug ~ ('^' || ${slug} || '-[a-z]{2,3}-[0-9]{4}-[0-9]{4}$'))
        AND m.season = ${seasonVal}
        ${roundFilter}
      ORDER BY m.kickoff_at ASC
      LIMIT 500
    `);
    return (rows as any[]).map((r:any) => ({
      id: r.id, slug: r.slug, status: r.status, minute: r.minute,
      kickoffAt: r.kickoff_at, season: r.season, round: r.round, venue: r.venue,
      homeTeamId: r.home_team_id, awayTeamId: r.away_team_id, leagueId: r.league_id,
      score: { home: r.home_score, away: r.away_score, homeHt: r.home_score_ht, awayHt: r.away_score_ht },
      homeTeam: { id: r.ht_id, name: r.ht_name, crestUrl: r.ht_crest, slug: r.ht_slug },
      awayTeam: { id: r.at_id, name: r.at_name, crestUrl: r.at_crest, slug: r.at_slug },
      league:   { id: r.l_id,  name: r.l_name,  countryCode: r.l_country, slug: r.l_slug },
    }));
  },

  async findStandingsByLeagueSlug(slug: string) {
    const { rows } = await db.execute(sql`
      SELECT DISTINCT ON (s.team_id)
        s.id, s.position, s.played, s.wins, s.draws, s.losses,
        s.goals_for, s.goals_against, s.points, s.form, s.zone,
        s.team_id, s.league_id, s.season,
        t.name AS team_name, t.crest_url AS team_crest, t.slug AS team_slug
      FROM standings s
      JOIN leagues l ON l.id = s.league_id
      JOIN teams   t ON t.id = s.team_id
      WHERE (l.slug = ${slug}
         OR l.slug ~ ('^' || ${slug} || '-[0-9]{4}-[0-9]{4}$')
         OR l.slug ~ ('^' || ${slug} || '-[a-z]{2,3}-[0-9]{4}-[0-9]{4}$'))
      ORDER BY s.team_id, s.season DESC, s.position ASC
    `);
    return (rows as any[]).map((r:any) => ({
      id: r.id, position: r.position, played: r.played,
      wins: r.wins, draws: r.draws, losses: r.losses,
      goalsFor: r.goals_for, goalsAgainst: r.goals_against,
      goalDiff: r.goals_for - r.goals_against,
      points: r.points, form: r.form, zone: r.zone,
      teamId: r.team_id, leagueId: r.league_id, season: r.season,
      teamName: r.team_name, teamCrest: r.team_crest, teamSlug: r.team_slug,
    }));
  },

  async findTopScorersByLeagueSlug(slug: string) {
    const { rows } = await db.execute(sql`
      SELECT
        ss.goals, ss.assists, ss.appearances, ss.minutes_played,
        ss.shots_total, ss.shots_on_target, ss.yellow_cards, ss.red_cards,
        ss.rating, ss.passes_total, ss.pass_accuracy,
        p.id AS player_id, p.name AS player_name, p.slug AS player_slug,
        t.id AS team_id, t.name AS team_name, t.crest_url AS team_crest, t.slug AS team_slug
      FROM season_stats ss
      JOIN leagues l ON l.id  = ss.league_id
      JOIN players p ON p.id  = ss.player_id
      JOIN teams   t ON t.id  = ss.team_id
      WHERE (l.slug = ${slug}
         OR l.slug ~ ('^' || ${slug} || '-[0-9]{4}-[0-9]{4}$')
         OR l.slug ~ ('^' || ${slug} || '-[a-z]{2,3}-[0-9]{4}-[0-9]{4}$'))
        AND ss.goals > 0
      GROUP BY p.id, p.name, p.slug, t.id, t.name, t.crest_url, t.slug, ss.goals, ss.assists, ss.appearances, ss.minutes_played, ss.shots_total, ss.shots_on_target, ss.yellow_cards, ss.red_cards, ss.rating, ss.passes_total, ss.pass_accuracy
      ORDER BY ss.goals DESC, ss.assists DESC
      LIMIT 50
    `);
    return (rows as any[]).map((r:any) => ({
      goals: r.goals, assists: r.assists, appearances: r.appearances,
      minutesPlayed: r.minutes_played, shotsTotal: r.shots_total,
      shotsOnTarget: r.shots_on_target, yellowCards: r.yellow_cards,
      redCards: r.red_cards, rating: r.rating,
      playerId: r.player_id, playerName: r.player_name, playerSlug: r.player_slug,
      teamId: r.team_id, teamName: r.team_name, teamCrest: r.team_crest, teamSlug: r.team_slug,
    }));
  },
  async findCardsByLeagueSlug(slug: string, type: string) {
    const { rows } = await db.execute(sql`
      SELECT
        p.id AS player_id, p.name AS player_name, p.slug AS player_slug,
        t.id AS team_id, t.name AS team_name, t.crest_url AS team_crest, t.slug AS team_slug,
        COUNT(CASE WHEN me.event_type = 'YELLOW' THEN 1 END)::int AS yellow_cards,
        COUNT(CASE WHEN me.event_type IN ('RED','SECOND_YELLOW') THEN 1 END)::int AS red_cards,
        COUNT(DISTINCT m.id) AS appearances,
        0 AS minutes_played
      FROM match_events me
      JOIN matches m ON m.id = me.match_id
      JOIN leagues l ON l.id = m.league_id
      JOIN players p ON p.id = me.player_id
      JOIN teams t ON t.id = me.team_id
      LEFT JOIN season_stats ss ON ss.player_id = p.id AND ss.league_id = l.id
      WHERE (l.slug = ${slug}
         OR l.slug ~ ('^' || ${slug} || '-[0-9]{4}-[0-9]{4}$')
         OR l.slug ~ ('^' || ${slug} || '-[a-z]{2,3}-[0-9]{4}-[0-9]{4}$'))
        AND me.event_type IN ('YELLOW','RED','SECOND_YELLOW')
        AND m.status = 'FINISHED'
      GROUP BY p.id, p.name, p.slug, t.id, t.name, t.crest_url, t.slug
      ORDER BY
        CASE WHEN ${type} = 'red'
          THEN COUNT(CASE WHEN me.event_type IN ('RED','SECOND_YELLOW') THEN 1 END)
          ELSE COUNT(CASE WHEN me.event_type = 'YELLOW' THEN 1 END)
        END DESC,
        COUNT(CASE WHEN me.event_type = 'YELLOW' THEN 1 END) DESC,
        p.name ASC
      LIMIT 30
    `);
    return (rows as any[]).map(r => ({
      playerId: r.player_id, playerName: r.player_name, playerSlug: r.player_slug,
      teamId: r.team_id, teamName: r.team_name, teamCrest: r.team_crest, teamSlug: r.team_slug,
      yellowCards: Number(r.yellow_cards ?? 0), redCards: Number(r.red_cards ?? 0),
      appearances: r.appearances ? Number(r.appearances) : null,
      minutesPlayed: r.minutes_played ? Number(r.minutes_played) : null,
    }));
  },
};
