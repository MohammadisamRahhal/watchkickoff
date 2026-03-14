import { db } from '@infrastructure/database/client.js';
import { matches, teams, leagues } from '@infrastructure/database/schema.js';
import { eq, sql } from 'drizzle-orm';
import { createLogger } from '@core/logger.js';
import type { MatchWithRelations } from './matches.types.js';

const logger = createLogger('matches-queries');

function mapRow(r: any): MatchWithRelations {
  return {
    id: r.id, slug: r.slug, status: r.status, minute: r.minute,
    kickoffAt: r.kickoff_at, season: r.season, round: r.round, venue: r.venue,
    score: { home: r.home_score, away: r.away_score, homeHt: r.home_score_ht, awayHt: r.away_score_ht },
    homeTeam: { id: r.ht_id, name: r.ht_name, crestUrl: r.ht_crest, slug: r.ht_slug },
    awayTeam: { id: r.at_id, name: r.at_name, crestUrl: r.at_crest, slug: r.at_slug },
    league: { id: r.l_id, name: r.l_name, countryCode: r.l_country, slug: r.l_slug, logoUrl: r.l_logo ?? null },
  } as unknown as MatchWithRelations;
}

const SEL = `m.id, m.slug, m.status, m.minute, m.kickoff_at, m.home_score, m.away_score, m.home_score_ht, m.away_score_ht, m.season, m.round, m.venue, m.raw_status, ht.id AS ht_id, ht.name AS ht_name, ht.crest_url AS ht_crest, ht.slug AS ht_slug, at.id AS at_id, at.name AS at_name, at.crest_url AS at_crest, at.slug AS at_slug, l.id AS l_id, l.name AS l_name, l.country_code AS l_country, l.slug AS l_slug, l.logo AS l_logo`;
const JOI = `FROM matches m JOIN teams ht ON ht.id = m.home_team_id JOIN teams at ON at.id = m.away_team_id JOIN leagues l ON l.id = m.league_id`;

export const matchesQueries = {
  async findTodayMatches(): Promise<MatchWithRelations[]> {
    return this.findByDate(new Date().toISOString().slice(0, 10));
  },

  async findByDate(dateStr: string): Promise<MatchWithRelations[]> {
    const start = new Date(`${dateStr}T00:00:00.000Z`);
    const end = new Date(`${dateStr}T23:59:59.999Z`);
    const { rows } = await db.execute(sql`SELECT ${sql.raw(SEL)} ${sql.raw(JOI)} WHERE m.kickoff_at >= ${start} AND m.kickoff_at < ${end} ORDER BY m.kickoff_at ASC`);
    return (rows as any[]).map(mapRow);
  },

  async findLiveMatches(): Promise<MatchWithRelations[]> {
    const { rows } = await db.execute(sql`SELECT ${sql.raw(SEL)} ${sql.raw(JOI)} WHERE m.status IN ('LIVE_1H','LIVE_2H','HALF_TIME','EXTRA_TIME','PENALTIES') ORDER BY m.kickoff_at`);
    return (rows as any[]).map(mapRow);
  },

  async findBySlug(slug: string): Promise<MatchWithRelations | null> {
    const { rows } = await db.execute(sql`SELECT ${sql.raw(SEL)} ${sql.raw(JOI)} WHERE m.slug = ${slug} LIMIT 1`);
    if (!(rows as any[]).length) return null;
    return mapRow((rows as any[])[0]);
  },

  async findById(id: string): Promise<MatchWithRelations | null> {
    const { rows } = await db.execute(sql`SELECT ${sql.raw(SEL)} ${sql.raw(JOI)} WHERE m.id = ${id} LIMIT 1`);
    if (!(rows as any[]).length) return null;
    return mapRow((rows as any[])[0]);
  },

  async findEventsByMatchId(matchId: string) {
    const { rows } = await db.execute(sql`SELECT me.id, me.event_type AS "eventType", me.minute, me.minute_extra AS "minuteExtra", me.team_id AS "teamId", me.player_id AS "playerId", me.detail, p2.slug AS assist_slug, me.meta, p.slug AS player_slug, p.name AS player_name, t.slug AS team_slug FROM match_events me LEFT JOIN players p ON p.id = me.player_id LEFT JOIN teams t ON t.id = me.team_id WHERE me.match_id = ${matchId} ORDER BY me.minute, me.minute_extra`);
    return rows as any[];
  },

  async upsertLeague(data: { externalId: string; name: string; countryCode: string; season: string; type: string; slug: string; logo?: string; }): Promise<string> {
    const existing = await db.select({ id: leagues.id, name: leagues.name }).from(leagues).where(sql`provider_ref->>'apiFootball' = ${data.externalId} AND season = ${data.season}`).limit(1);
    if (existing[0]) {
      if ((existing[0].name === data.externalId || /^\d+$/.test(existing[0].name)) && data.name !== data.externalId) {
        await db.update(leagues).set({ name: data.name, countryCode: data.countryCode.slice(0, 2).toUpperCase(), ...(data.logo ? { logo: data.logo } : {}) }).where(eq(leagues.id, existing[0].id));
      }
      return existing[0].id;
    }
    const inserted = await db.insert(leagues).values({ name: data.name, slug: data.slug, countryCode: data.countryCode.slice(0, 2).toUpperCase(), season: data.season, type: data.type as any, providerRef: { apiFootball: data.externalId }, ...(data.logo ? { logo: data.logo } : {}) }).onConflictDoUpdate({ target: leagues.slug, set: { name: data.name, countryCode: data.countryCode.slice(0, 2).toUpperCase(), ...(data.logo ? { logo: data.logo } : {}) } }).returning({ id: leagues.id });
    return inserted[0]!.id;
  },

  async upsertTeam(data: { externalId: string; name: string; countryCode: string; slug: string; crestUrl?: string; }): Promise<string> {
    const existing = await db.select({ id: teams.id, name: teams.name }).from(teams).where(sql`provider_ref->>'apiFootball' = ${data.externalId}`).limit(1);
    if (existing[0]) {
      if ((existing[0].name === data.externalId || /^\d+$/.test(existing[0].name)) && data.name !== data.externalId) {
        await db.update(teams).set({ name: data.name, countryCode: (data.countryCode ?? 'WW').slice(0, 2).toUpperCase(), crestUrl: data.crestUrl }).where(eq(teams.id, existing[0].id));
      }
      return existing[0].id;
    }
    const inserted = await db.insert(teams).values({ name: data.name, slug: data.slug, countryCode: (data.countryCode ?? 'WW').slice(0, 2).toUpperCase(), crestUrl: data.crestUrl, providerRef: { apiFootball: data.externalId } }).onConflictDoUpdate({ target: teams.slug, set: { name: data.name, crestUrl: data.crestUrl, countryCode: (data.countryCode ?? 'WW').slice(0, 2).toUpperCase() } }).returning({ id: teams.id });
    return inserted[0]!.id;
  },

  async upsertMatch(data: { externalId: string; leagueId: string; homeTeamId: string; awayTeamId: string; kickoffAt: Date; status: string; homeScore: number; awayScore: number; homeScoreHt?: number; awayScoreHt?: number; minute?: number; minuteExtra?: number; season: string; round?: string; venue?: string; rawStatus?: string; slug: string; }): Promise<string> {
    const existing = await db.select({ id: matches.id, slug: matches.slug }).from(matches).where(sql`home_team_id = ${data.homeTeamId} AND away_team_id = ${data.awayTeamId} AND kickoff_at = ${data.kickoffAt}`).limit(1);
    if (existing[0]) {
      await db.update(matches).set({ slug: data.slug, status: data.status as any, homeScore: data.homeScore, awayScore: data.awayScore, homeScoreHt: data.homeScoreHt, awayScoreHt: data.awayScoreHt, minute: data.minute, minuteExtra: data.minuteExtra, rawStatus: data.rawStatus, updatedAt: new Date() }).where(eq(matches.id, existing[0].id));
      return existing[0].id;
    }
    const inserted = await db.insert(matches).values({ slug: data.slug, leagueId: data.leagueId, homeTeamId: data.homeTeamId, awayTeamId: data.awayTeamId, kickoffAt: data.kickoffAt, status: data.status as any, homeScore: data.homeScore, awayScore: data.awayScore, homeScoreHt: data.homeScoreHt, awayScoreHt: data.awayScoreHt, minute: data.minute, minuteExtra: data.minuteExtra, season: data.season, round: data.round, venue: data.venue, rawStatus: data.rawStatus, providerRef: { apiFootball: data.externalId } }).returning({ id: matches.id });
    return inserted[0]!.id;
  },

  async findLineupsByMatchId(matchId: string) {
    const { rows } = await db.execute(sql`SELECT ml.is_starter, ml.is_captain, ml.shirt_number, ml.position_code, ml.formation_slot, p.id AS player_id, p.name AS player_name, p.slug AS player_slug, p.position, t.id AS team_id, t.slug AS team_slug FROM match_lineups ml JOIN players p ON p.id = ml.player_id JOIN teams t ON t.id = ml.team_id WHERE ml.match_id = ${matchId} ORDER BY t.id, ml.is_starter DESC, ml.shirt_number ASC`);
    return rows as any[];
  },

  async findByProviderRef(externalId: string): Promise<{ slug: string } | null> {
    const { rows } = await db.execute(sql`
      SELECT m.slug FROM matches m
      WHERE m.provider_ref->>'apiFootball' = ${externalId}
      LIMIT 1
    `);
    if (!(rows as any[]).length) return null;
    return { slug: (rows as any[])[0].slug };
  },

  async findH2HMatches(homeTeamId: string, awayTeamId: string, limit: number = 10) {
    const { rows } = await db.execute(sql`
      SELECT
        m.id, m.slug, m.kickoff_at, m.home_score, m.away_score, m.status,
        ht.id AS ht_id, ht.name AS ht_name, ht.slug AS ht_slug, ht.crest_url AS ht_crest,
        at.id AS at_id, at.name AS at_name, at.slug AS at_slug, at.crest_url AS at_crest,
        l.name AS l_name, l.slug AS l_slug
      FROM matches m
      JOIN teams ht ON ht.id = m.home_team_id
      JOIN teams at ON at.id = m.away_team_id
      LEFT JOIN leagues l ON l.id = m.league_id
      WHERE (
        (m.home_team_id = ${homeTeamId} AND m.away_team_id = ${awayTeamId})
        OR
        (m.home_team_id = ${awayTeamId} AND m.away_team_id = ${homeTeamId})
      )
      AND m.status IN ('FINISHED','AWARDED')
      ORDER BY m.kickoff_at DESC
      LIMIT ${limit}
    `);
    return (rows as any[]).map(r => ({
      id: r.id, slug: r.slug, kickoffAt: r.kickoff_at,
      homeScore: r.home_score, awayScore: r.away_score, status: r.status,
      homeTeam: { id: r.ht_id, name: r.ht_name, slug: r.ht_slug, crestUrl: r.ht_crest },
      awayTeam: { id: r.at_id, name: r.at_name, slug: r.at_slug, crestUrl: r.at_crest },
      league: r.l_name ? { name: r.l_name, slug: r.l_slug } : null,
    }));
  },

  async findFullMatchBySlug(slug: string) {
    const match = await this.findBySlug(slug);
    if (!match) return null;
    const id = match.id as string;
    const events = await this.findEventsByMatchId(id);
    const lineups = await this.findLineupsByMatchId(id);

    let statistics: any[] = [];
    try {
      const { rows } = await db.execute(sql`
        SELECT type, home_value AS home, away_value AS away
        FROM match_statistics WHERE match_id = ${id} ORDER BY sort_order ASC
      `);
      statistics = rows as any[];
    } catch { statistics = []; }

    return {
      id: match.id, slug: match.slug, status: match.status,
      kickoffAt: match.kickoffAt, season: match.season,
      round: match.round, venue: match.venue,
      minute: match.minute, minuteExtra: (match as any).minuteExtra ?? null,
      homeScore: match.score?.home ?? 0, awayScore: match.score?.away ?? 0,
      homeScoreHt: match.score?.homeHt ?? null, awayScoreHt: match.score?.awayHt ?? null,
      homeTeam: match.homeTeam, awayTeam: match.awayTeam, league: match.league,
      events: events.map((e: any) => ({
        id: e.id, eventType: e.eventType, minute: e.minute, minuteExtra: e.minuteExtra,
        teamId: e.teamId, playerName: e.player_name, playerSlug: e.player_slug ?? null, assistPlayerName: e.assist_name ?? null, detail: e.detail,
      })),
      lineups: lineups.map((l: any) => ({
        id: l.player_id, teamId: l.team_id, playerName: l.player_name, playerSlug: l.player_slug,
        shirtNumber: l.shirt_number, positionCode: l.position_code,
        formationSlot: l.formation_slot, isStarter: l.is_starter, isCaptain: l.is_captain,
      })),
      statistics,
    };
  },
};
