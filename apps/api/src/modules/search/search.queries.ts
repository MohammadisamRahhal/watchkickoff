import { db } from '@infrastructure/database/client.js';
import { teams, leagues, players } from '@infrastructure/database/schema.js';
import { sql, ilike, or } from 'drizzle-orm';
import { createLogger } from '@core/logger.js';

const logger = createLogger('search-queries');

export const searchQueries = {
  _logger: logger,

  async search(q: string) {
    const pattern = `%${q}%`;

    const [teamRows, leagueRows, playerRows] = await Promise.all([
      db.select({ id: teams.id, name: teams.name, slug: teams.slug, crestUrl: teams.crestUrl, countryCode: teams.countryCode })
        .from(teams).where(ilike(teams.name, pattern)).limit(10),

      db.select({ id: leagues.id, name: leagues.name, slug: leagues.slug, countryCode: leagues.countryCode, season: leagues.season })
        .from(leagues).where(ilike(leagues.name, pattern)).limit(10),

      db.select({ id: players.id, name: players.name, slug: players.slug, position: players.position, nationalityCode: players.nationalityCode })
        .from(players).where(ilike(players.name, pattern)).limit(10),
    ]);

    return {
      teams:   teamRows.map(r => ({ ...r, type: 'team' as const })),
      leagues: leagueRows.map(r => ({ ...r, type: 'league' as const })),
      players: playerRows.map(r => ({ ...r, type: 'player' as const })),
    };
  },
};
