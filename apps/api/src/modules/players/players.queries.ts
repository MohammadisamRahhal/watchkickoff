import { db } from '@infrastructure/database/client.js';
import { players, seasonStats, leagues, teams } from '@infrastructure/database/schema.js';
import { eq, sql } from 'drizzle-orm';
import { createLogger } from '@core/logger.js';

const logger = createLogger('players-queries');

export const playersQueries = {
  _logger: logger,

  async findBySlug(slug: string) {
    const rows = await db.select().from(players).where(eq(players.slug, slug)).limit(1);
    return rows[0] ?? null;
  },

  async findStatsByPlayerId(playerId: string) {
    const { rows } = await db.execute(sql`
      SELECT
        ss.goals, ss.assists, ss.appearances, ss.minutes_played,
        ss.yellow_cards, ss.red_cards, ss.shots_total, ss.shots_on_target,
        ss.pass_accuracy, ss.rating, ss.season,
        l.id AS league_id, l.name AS league_name, l.slug AS league_slug, l.country_code,
        t.id AS team_id,   t.name AS team_name,   t.slug AS team_slug, t.crest_url AS team_crest
      FROM season_stats ss
      JOIN leagues l ON l.id = ss.league_id
      JOIN teams   t ON t.id = ss.team_id
      WHERE ss.player_id = ${playerId}
      ORDER BY ss.season DESC, ss.goals DESC
    `);
    return rows as any[];
  },
};
