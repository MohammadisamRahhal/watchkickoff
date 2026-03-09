import { db } from '@infrastructure/database/client.js';
import { teams, matches, standings, leagues, seasonStats, players } from '@infrastructure/database/schema.js';
import { eq, sql } from 'drizzle-orm';
import { createLogger } from '@core/logger.js';

const logger = createLogger('teams-queries');

export const teamsQueries = {
  _logger: logger,

  async findBySlug(slug: string) {
    const rows = await db.select().from(teams).where(eq(teams.slug, slug)).limit(1);
    return rows[0] ?? null;
  },

  async findMatchesByTeamId(teamId: string) {
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
      WHERE m.home_team_id = ${teamId} OR m.away_team_id = ${teamId}
      ORDER BY m.kickoff_at DESC
      LIMIT 50
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

  async findStandingByTeamId(teamId: string) {
    const { rows } = await db.execute(sql`
      SELECT s.*, l.name AS league_name, l.slug AS league_slug, l.country_code
      FROM standings s
      JOIN leagues l ON l.id = s.league_id
      WHERE s.team_id = ${teamId}
      ORDER BY s.updated_at DESC
      LIMIT 5
    `);
    return rows as any[];
  },

  async findSquadByTeamId(teamId: string) {
    const { rows } = await db.execute(sql`
      SELECT p.id, p.name, p.slug, p.position, p.nationality_code, p.date_of_birth,
             p.height_cm, p.preferred_foot,
             ss.goals, ss.assists, ss.appearances, ss.yellow_cards, ss.red_cards, ss.rating
      FROM players p
      LEFT JOIN season_stats ss ON ss.player_id = p.id AND ss.team_id = ${teamId}
      WHERE p.current_team_id = ${teamId}
      ORDER BY p.position ASC, p.name ASC
    `);
    return rows as any[];
  },
};
