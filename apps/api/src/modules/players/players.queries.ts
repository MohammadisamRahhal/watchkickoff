import { db } from '@infrastructure/database/client.js';
import { sql } from 'drizzle-orm';

export const playersQueries = {
  async findBySlug(slug: string) {
    const { rows } = await db.execute(sql`
      SELECT p.id, p.name, p.slug, p.nationality_code, p.date_of_birth,
             p.height_cm, p.preferred_foot, p.position, p.status, p.provider_ref,
             t.name AS current_team_name, t.slug AS current_team_slug, t.crest_url AS current_team_crest
      FROM players p
      LEFT JOIN teams t ON t.id = p.current_team_id
      WHERE p.slug = ${slug}
    `);
    return (rows[0] as any) ?? null;
  },

  async findStatsBySlug(slug: string, season?: string) {
    const seasonFilter = season ? sql`AND ss.season = ${season}` : sql``;
    const { rows } = await db.execute(sql`
      SELECT ss.season, ss.goals, ss.assists, ss.appearances, ss.minutes_played,
             ss.yellow_cards, ss.red_cards, ss.shots_total, ss.shots_on_target,
             ss.pass_accuracy, ss.rating,
             l.name AS league_name, l.slug AS league_slug, l.provider_ref AS league_provider_ref,
             t.name AS team_name, t.slug AS team_slug, t.crest_url AS team_crest
      FROM season_stats ss
      JOIN players p ON p.id = ss.player_id
      JOIN leagues l ON l.id = ss.league_id
      JOIN teams t   ON t.id = ss.team_id
      WHERE p.slug = ${slug}
      ${seasonFilter}
      ORDER BY ss.season DESC, ss.goals DESC
    `);
    return rows as any[];
  },

  async findCareer(slug: string) {
    const { rows } = await db.execute(sql`
      SELECT ss.season, ss.appearances, ss.goals, ss.assists, ss.minutes_played,
             ss.yellow_cards, ss.red_cards,
             t.name AS team_name, t.slug AS team_slug, t.crest_url AS team_crest,
             l.name AS league_name, l.slug AS league_slug
      FROM season_stats ss
      JOIN players p ON p.id = ss.player_id
      JOIN teams t   ON t.id = ss.team_id
      JOIN leagues l ON l.id = ss.league_id
      WHERE p.slug = ${slug}
      ORDER BY ss.season DESC, ss.appearances DESC
    `);
    return rows as any[];
  },

  async findRecentMatches(slug: string) {
    const { rows } = await db.execute(sql`
      SELECT DISTINCT ON (m.kickoff_at, m.id)
        m.id, m.slug, m.kickoff_at, m.status,
        m.home_score, m.away_score,
        ht.name AS home_team, ht.crest_url AS home_crest, ht.slug AS home_slug,
        at2.name AS away_team, at2.crest_url AS away_crest, at2.slug AS away_slug,
        l.name AS league_name, l.slug AS league_slug,
        (SELECT COUNT(*) FROM match_events me2
         WHERE me2.match_id = m.id AND me2.player_id = p.id
         AND me2.event_type IN ('GOAL','PENALTY_SCORED'))::int AS goals,
        (SELECT COUNT(*) FROM match_events me3
         WHERE me3.match_id = m.id AND me3.assist_player_id = p.id)::int AS assists,
        (SELECT COUNT(*) FROM match_events me4
         WHERE me4.match_id = m.id AND me4.player_id = p.id
         AND me4.event_type = 'YELLOW')::int AS yellow_cards,
        (SELECT COUNT(*) FROM match_events me5
         WHERE me5.match_id = m.id AND me5.player_id = p.id
         AND me5.event_type IN ('RED','SECOND_YELLOW'))::int AS red_cards
      FROM players p
      JOIN match_events me ON me.player_id = p.id
      JOIN matches m       ON m.id = me.match_id AND m.status = 'FINISHED'
      JOIN teams ht        ON ht.id = m.home_team_id
      JOIN teams at2       ON at2.id = m.away_team_id
      JOIN leagues l       ON l.id = m.league_id
      WHERE p.slug = ${slug}
      ORDER BY m.kickoff_at DESC, m.id
      LIMIT 10
    `);
    return rows as any[];
  },
};
