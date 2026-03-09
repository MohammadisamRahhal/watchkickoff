/**
 * Standings queries — ALL SQL for the standings module lives here.
 */
import { db } from '@infrastructure/database/client.js';
import { standings, leagues, teams } from '@infrastructure/database/schema.js';
import { eq, sql } from 'drizzle-orm';
import { createLogger } from '@core/logger.js';

const logger = createLogger('standings-queries');

export const standingsQueries = {
  _logger: logger,

  async findByLeagueId(leagueId: string, season: string) {
    const { rows } = await db.execute(sql`
      SELECT
        s.id, s.position, s.played, s.wins, s.draws, s.losses,
        s.goals_for, s.goals_against, s.points, s.form, s.zone,
        s.team_id, s.league_id, s.season,
        t.name AS team_name, t.crest_url AS team_crest, t.slug AS team_slug
      FROM standings s
      JOIN teams t ON t.id = s.team_id
      WHERE s.league_id = ${leagueId} AND s.season = ${season}
      ORDER BY s.position ASC
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

  async upsertStanding(data: {
    leagueId: string; teamId: string; season: string;
    position: number; played: number; wins: number; draws: number; losses: number;
    goalsFor: number; goalsAgainst: number; points: number;
    form: string | null; zone: string;
  }): Promise<void> {
    await db.execute(sql`
      INSERT INTO standings (
        id, league_id, team_id, season, position, played, wins, draws, losses,
        goals_for, goals_against, points, form, zone, updated_at
      ) VALUES (
        gen_random_uuid(), ${data.leagueId}, ${data.teamId}, ${data.season},
        ${data.position}, ${data.played}, ${data.wins}, ${data.draws}, ${data.losses},
        ${data.goalsFor}, ${data.goalsAgainst}, ${data.points},
        ${data.form}, ${data.zone as any}, NOW()
      )
      ON CONFLICT (league_id, team_id, season) DO UPDATE SET
        position     = EXCLUDED.position,
        played       = EXCLUDED.played,
        wins         = EXCLUDED.wins,
        draws        = EXCLUDED.draws,
        losses       = EXCLUDED.losses,
        goals_for    = EXCLUDED.goals_for,
        goals_against = EXCLUDED.goals_against,
        points       = EXCLUDED.points,
        form         = EXCLUDED.form,
        zone         = EXCLUDED.zone,
        updated_at   = NOW()
    `);
  },
};
