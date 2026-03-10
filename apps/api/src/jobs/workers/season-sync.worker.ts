import { footballApiGet } from '@infrastructure/http/football-api.client.js';
import { createLogger } from '@core/logger.js';
import { db } from '@infrastructure/database/client.js';
import { leagues, teams, matches } from '@infrastructure/database/schema.js';
import { eq, sql } from 'drizzle-orm';

const logger = createLogger('worker:season-sync');

// Top leagues to sync fully
const PRIORITY_LEAGUES = [39,40,41,42,45,78,79,135,136,140,141,61,62,2,3,848,253,94,88,71,203,307,262,233,235,78];

export async function runSeasonSync(): Promise<void> {
  logger.info('season-sync started');

  const activeLeagues = await db.select().from(leagues).where(eq(leagues.isActive, true));
  const prioritySet = new Set(PRIORITY_LEAGUES.map(String));

  // Filter to priority leagues only for now
  const toSync = activeLeagues.filter(l => {
    const extId = (l.providerRef as any)?.apiFootball;
    return prioritySet.has(extId);
  });

  logger.info({ count: toSync.length }, 'Leagues to sync');

  let totalMatches = 0, failed = 0;

  for (const league of toSync) {
    try {
      const extId = (league.providerRef as any)?.apiFootball;
      const season = league.season ?? 2025;

      const data = await footballApiGet(`/fixtures?league=${extId}&season=${season}`) as any;
      const fixtures = data.response ?? [];

      for (const fx of fixtures) {
        const homeId = String(fx.teams.home.id);
        const awayId = String(fx.teams.away.id);

        // Upsert home team
        await db.insert(teams).values({
          id: sql`gen_random_uuid()`,
          name: fx.teams.home.name,
          slug: `team-${homeId}-${fx.teams.home.name.toLowerCase().replace(/[^a-z0-9]/g,'-').slice(0,40)}`,
          countryCode: (fx.fixture.venue?.country ?? league.countryCode ?? 'WW').slice(0,2).toUpperCase(),
          crestUrl: fx.teams.home.logo,
          providerRef: { apiFootball: homeId },
          createdAt: new Date(), updatedAt: new Date(),
        }).onConflictDoNothing();

        // Upsert away team
        await db.insert(teams).values({
          id: sql`gen_random_uuid()`,
          name: fx.teams.away.name,
          slug: `team-${awayId}-${fx.teams.away.name.toLowerCase().replace(/[^a-z0-9]/g,'-').slice(0,40)}`,
          countryCode: (fx.fixture.venue?.country ?? league.countryCode ?? 'WW').slice(0,2).toUpperCase(),
          crestUrl: fx.teams.away.logo,
          providerRef: { apiFootball: awayId },
          createdAt: new Date(), updatedAt: new Date(),
        }).onConflictDoNothing();

        // Find team IDs
        const homeTeam = await db.select({ id: teams.id }).from(teams)
          .where(sql`provider_ref->>'apiFootball' = ${homeId}`).limit(1);
        const awayTeam = await db.select({ id: teams.id }).from(teams)
          .where(sql`provider_ref->>'apiFootball' = ${awayId}`).limit(1);

        if (!homeTeam[0] || !awayTeam[0]) continue;

        const matchSlug = `match-${fx.fixture.id}`;
        const status = mapStatus(fx.fixture.status.short);

        await db.insert(matches).values({
          id: sql`gen_random_uuid()`,
          slug: matchSlug,
          leagueId: league.id,
          homeTeamId: homeTeam[0].id,
          awayTeamId: awayTeam[0].id,
          kickoffAt: new Date(fx.fixture.date),
          status: status as any,
          homeScore: fx.goals.home ?? 0,
          awayScore: fx.goals.away ?? 0,
          homeScoreHt: fx.score.halftime.home ?? 0,
          awayScoreHt: fx.score.halftime.away ?? 0,
          season: String(season),
          round: fx.league.round,
          venue: fx.fixture.venue?.name,
          rawStatus: fx.fixture.status.short,
          providerRef: { apiFootball: String(fx.fixture.id) },
          createdAt: new Date(), updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: matches.slug,
          set: {
            status: status as any,
            homeScore: fx.goals.home,
            awayScore: fx.goals.away,
            rawStatus: fx.fixture.status.short,
            updatedAt: new Date(),
          }
        });
        totalMatches++;
      }

      logger.info({ league: league.slug, fixtures: fixtures.length }, 'League synced');
      await new Promise(r => setTimeout(r, 400)); // rate limit
    } catch (e: any) {
      failed++;
      logger.error({ league: league.slug, err: e.message }, 'Failed to sync league');
    }
  }

  logger.info({ totalMatches, failed }, 'season-sync complete');
}

function mapStatus(short: string): string {
  const map: Record<string, string> = {
    'NS': 'SCHEDULED', 'TBD': 'SCHEDULED',
    '1H': 'LIVE', 'HT': 'LIVE', '2H': 'LIVE', 'ET': 'LIVE', 'P': 'LIVE', 'BT': 'LIVE',
    'FT': 'FINISHED', 'AET': 'FINISHED', 'PEN': 'FINISHED',
    'PST': 'POSTPONED', 'CANC': 'CANCELLED', 'ABD': 'CANCELLED',
  };
  return map[short] ?? 'SCHEDULED';
}
