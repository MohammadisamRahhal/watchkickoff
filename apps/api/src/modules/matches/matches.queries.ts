/**
 * Matches queries — ALL SQL for the matches module lives here.
 */
import { db } from '@infrastructure/database/client.js';
import { matches, teams, leagues, matchEvents } from '@infrastructure/database/schema.js';
import { eq, and, gte, lt, inArray } from 'drizzle-orm';
import { createLogger } from '@core/logger.js';
import type { MatchWithRelations } from './matches.types.js';

const logger = createLogger('matches-queries');

const LIVE_STATUSES = ['LIVE_1H', 'HALF_TIME', 'LIVE_2H', 'EXTRA_TIME', 'PENALTIES'] as const;

export const matchesQueries = {

  async findTodayMatches(): Promise<MatchWithRelations[]> {
    const now = new Date();
    const start = new Date(now); start.setUTCHours(0, 0, 0, 0);
    const end   = new Date(now); end.setUTCHours(23, 59, 59, 999);
    const homeTeams = teams.$inferSelect ? teams : teams;
    const awayTeams = db.select({ id: teams.id, name: teams.name, crestUrl: teams.crestUrl, slug: teams.slug }).from(teams).as('away_teams');
    const rows = await db.select({
      match:    matches,
      homeTeam: { id: teams.id, name: teams.name, crestUrl: teams.crestUrl, slug: teams.slug },
      awayTeam: { id: awayTeams.id, name: awayTeams.name, crestUrl: awayTeams.crestUrl, slug: awayTeams.slug },
      league:   { id: leagues.id, name: leagues.name, countryCode: leagues.countryCode, slug: leagues.slug },
    }).from(matches)
      .innerJoin(teams,     eq(matches.homeTeamId, teams.id))
      .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
      .innerJoin(leagues,   eq(matches.leagueId, leagues.id))
      .where(and(gte(matches.kickoffAt, start), lt(matches.kickoffAt, end)));
    return rows as unknown as MatchWithRelations[];
  },

  async findLiveMatches(): Promise<MatchWithRelations[]> {
    const rows = await db.select({
      match:    matches,
      homeTeam: { id: teams.id, name: teams.name, crestUrl: teams.crestUrl, slug: teams.slug },
      league:   { id: leagues.id, name: leagues.name, countryCode: leagues.countryCode, slug: leagues.slug },
    }).from(matches)
      .innerJoin(teams,   eq(matches.homeTeamId, teams.id))
      .innerJoin(leagues, eq(matches.leagueId, leagues.id))
      .where(inArray(matches.status, [...LIVE_STATUSES]));
    return rows as unknown as MatchWithRelations[];
  },

  async findById(id: string): Promise<MatchWithRelations | null> {
    const rows = await db.select({
      match:    matches,
      homeTeam: { id: teams.id, name: teams.name, crestUrl: teams.crestUrl, slug: teams.slug },
      league:   { id: leagues.id, name: leagues.name, countryCode: leagues.countryCode, slug: leagues.slug },
    }).from(matches)
      .innerJoin(teams,   eq(matches.homeTeamId, teams.id))
      .innerJoin(leagues, eq(matches.leagueId, leagues.id))
      .where(eq(matches.id, id)).limit(1);
    return rows[0] as unknown as MatchWithRelations ?? null;
  },

  async findEventsByMatchId(matchId: string) {
    return db.select().from(matchEvents)
      .where(eq(matchEvents.matchId, matchId))
      .orderBy(matchEvents.minute, matchEvents.minuteExtra);
  },

  async upsertLeague(data: {
    externalId: string; name: string; countryCode: string;
    season: string; type: string; slug: string;
  }): Promise<string> {
    const existing = await db.select({ id: leagues.id }).from(leagues)
      .where(eq(leagues.slug, data.slug)).limit(1);
    if (existing[0]) return existing[0].id;
    const inserted = await db.insert(leagues).values({
      name: data.name, slug: data.slug,
      countryCode: data.countryCode.slice(0, 2).toUpperCase(),
      season: data.season, type: data.type as 'LEAGUE' | 'CUP' | 'TOURNAMENT',
      providerRef: { apiFootball: data.externalId },
    }).returning({ id: leagues.id });
    return inserted[0]!.id;
  },

  async upsertTeam(data: {
    externalId: string; name: string; countryCode: string;
    slug: string; crestUrl?: string;
  }): Promise<string> {
    const existing = await db.select({ id: teams.id }).from(teams)
      .where(eq(teams.slug, data.slug)).limit(1);
    if (existing[0]) return existing[0].id;
    const inserted = await db.insert(teams).values({
      name: data.name, slug: data.slug,
      countryCode: (data.countryCode ?? 'WW').slice(0, 2).toUpperCase(),
      crestUrl: data.crestUrl,
      providerRef: { apiFootball: data.externalId },
    }).returning({ id: teams.id });
    return inserted[0]!.id;
  },

  async upsertMatch(data: {
    externalId: string; leagueId: string; homeTeamId: string; awayTeamId: string;
    kickoffAt: Date; status: string; homeScore: number; awayScore: number;
    homeScoreHt?: number; awayScoreHt?: number; minute?: number; minuteExtra?: number;
    season: string; round?: string; venue?: string; rawStatus?: string; slug: string;
  }): Promise<string> {
    const existing = await db.select({ id: matches.id }).from(matches)
      .where(eq(matches.slug, data.slug)).limit(1);
    if (existing[0]) {
      await db.update(matches).set({
        status: data.status as any, homeScore: data.homeScore, awayScore: data.awayScore,
        homeScoreHt: data.homeScoreHt, awayScoreHt: data.awayScoreHt,
        minute: data.minute, minuteExtra: data.minuteExtra,
        rawStatus: data.rawStatus, updatedAt: new Date(),
      }).where(eq(matches.id, existing[0].id));
      return existing[0].id;
    }
    const inserted = await db.insert(matches).values({
      slug: data.slug, leagueId: data.leagueId,
      homeTeamId: data.homeTeamId, awayTeamId: data.awayTeamId,
      kickoffAt: data.kickoffAt, status: data.status as any,
      homeScore: data.homeScore, awayScore: data.awayScore,
      homeScoreHt: data.homeScoreHt, awayScoreHt: data.awayScoreHt,
      minute: data.minute, minuteExtra: data.minuteExtra,
      season: data.season, round: data.round, venue: data.venue,
      rawStatus: data.rawStatus, providerRef: { apiFootball: data.externalId },
    }).returning({ id: matches.id });
    return inserted[0]!.id;
  },
};
