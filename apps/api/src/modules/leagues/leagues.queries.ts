/**
 * Leagues queries — ALL SQL for the leagues module lives here.
 */
import { db } from '@infrastructure/database/client.js';
import { leagues, matches, teams, standings } from '@infrastructure/database/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
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
    const rows = await db.select().from(leagues)
      .where(eq(leagues.slug, slug)).limit(1);
    if (rows[0]) return rows[0];
    const { rows: fuzzy } = await db.execute(sql`
      SELECT * FROM leagues
      WHERE slug ~ ('^' || ${slug} || '-[0-9]{4}-[0-9]{4}$')
         OR slug ~ ('^' || ${slug} || '-[a-z]{2,3}-[0-9]{4}-[0-9]{4}$')
      ORDER BY season DESC
      LIMIT 1
    `);
    return (fuzzy[0] as any) ?? null;
  },

  async findMatchesByLeagueSlug(slug: string) {
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
      WHERE l.slug = ${slug}
         OR l.slug ~ ('^' || ${slug} || '-[0-9]{4}-[0-9]{4}$')
         OR l.slug ~ ('^' || ${slug} || '-[a-z]{2,3}-[0-9]{4}-[0-9]{4}$')
      ORDER BY ABS(EXTRACT(EPOCH FROM (m.kickoff_at - NOW()))) ASC
      LIMIT 200
    `);
    return (rows as any[]).map(r => ({
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
      WHERE l.slug = ${slug}
         OR l.slug ~ ('^' || ${slug} || '-[0-9]{4}-[0-9]{4}$')
         OR l.slug ~ ('^' || ${slug} || '-[a-z]{2,3}-[0-9]{4}-[0-9]{4}$')
      ORDER BY s.team_id, s.position ASC
    `);
    return (rows as any[]).map(r => ({
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
        ss.goals, ss.assists, ss.appearances,
        p.id AS player_id, p.name AS player_name, p.slug AS player_slug,
        t.id AS team_id,   t.name AS team_name,   t.crest_url AS team_crest, t.slug AS team_slug
      FROM season_stats ss
      JOIN leagues l  ON l.id  = ss.league_id
      JOIN players p  ON p.id  = ss.player_id
      JOIN teams   t  ON t.id  = ss.team_id
      WHERE (l.slug = ${slug}
         OR l.slug ~ ('^' || ${slug} || '-[0-9]{4}-[0-9]{4}$')
         OR l.slug ~ ('^' || ${slug} || '-[a-z]{2,3}-[0-9]{4}-[0-9]{4}$'))
        AND ss.goals > 0
      GROUP BY p.id, p.name, p.slug, t.id, t.name, t.crest_url, t.slug, ss.goals, ss.assists, ss.appearances
      ORDER BY ss.goals DESC, ss.assists DESC
      LIMIT 20
    `);
    return (rows as any[]).map(r => ({
      goals: r.goals, assists: r.assists, appearances: r.appearances,
      playerId: r.player_id, playerName: r.player_name, playerSlug: r.player_slug,
      teamId: r.team_id, teamName: r.team_name, teamCrest: r.team_crest, teamSlug: r.team_slug,
    }));
  },
};
