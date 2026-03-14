import { playersQueries } from './players.queries.js';

function age(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function parseRef(ref: unknown): Record<string,string> {
  try {
    if (typeof ref === 'string') return JSON.parse(ref);
    if (ref && typeof ref === 'object') return ref as Record<string,string>;
  } catch {}
  return {};
}

function photoUrl(ref: unknown): string | null {
  const r = parseRef(ref);
  const id = r['apiFootball'] ?? r['api-football'];
  return id ? `https://media.api-sports.io/football/players/${id}.png` : null;
}

function leagueLogo(ref: unknown): string | null {
  const r = parseRef(ref);
  const id = r['apiFootball'] ?? r['api-football'];
  return id ? `https://media.api-sports.io/football/leagues/${id}.png` : null;
}

export const playersService = {
  async getPlayerBySlug(slug: string) {
    const row = await playersQueries.findBySlug(slug);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      photo: photoUrl(row.provider_ref),
      nationalityCode: row.nationality_code,
      dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth).toISOString().split('T')[0] : null,
      age: age(row.date_of_birth),
      heightCm: row.height_cm,
      preferredFoot: row.preferred_foot,
      position: row.position,
      status: row.status,
      currentTeam: row.current_team_name ? {
        name: row.current_team_name,
        slug: row.current_team_slug,
        crest: row.current_team_crest,
      } : null,
    };
  },

  async getPlayerStats(slug: string, season?: string) {
    const rows = await playersQueries.findStatsBySlug(slug, season);
    return rows.map((r: Record<string,unknown>) => ({
      season: r.season,
      league: { name: r.league_name, slug: r.league_slug, logo: leagueLogo(r.league_provider_ref) },
      team:   { name: r.team_name,   slug: r.team_slug,   crest: r.team_crest },
      goals:         (r.goals as number) ?? 0,
      assists:       (r.assists as number) ?? 0,
      appearances:   (r.appearances as number) ?? 0,
      minutesPlayed: (r.minutes_played as number) ?? 0,
      yellowCards:   (r.yellow_cards as number) ?? 0,
      redCards:      (r.red_cards as number) ?? 0,
      shotsTotal:    (r.shots_total as number) ?? 0,
      shotsOnTarget: (r.shots_on_target as number) ?? 0,
      passAccuracy:  r.pass_accuracy ? parseFloat(r.pass_accuracy as string) : null,
      rating:        r.rating ? parseFloat(r.rating as string) : null,
    }));
  },

  async getPlayerCareer(slug: string) {
    const rows = await playersQueries.findCareer(slug);
    return rows.map((r: Record<string,unknown>) => ({
      season:        r.season,
      team:          { name: r.team_name, slug: r.team_slug, crest: r.team_crest },
      league:        { name: r.league_name, slug: r.league_slug },
      appearances:   (r.appearances as number) ?? 0,
      goals:         (r.goals as number) ?? 0,
      assists:       (r.assists as number) ?? 0,
      minutesPlayed: (r.minutes_played as number) ?? 0,
      yellowCards:   (r.yellow_cards as number) ?? 0,
      redCards:      (r.red_cards as number) ?? 0,
    }));
  },

  async getPlayerRecentMatches(slug: string) {
    const rows = await playersQueries.findRecentMatches(slug);
    return rows.map((r: Record<string,unknown>) => ({
      slug:        r.slug,
      kickoffAt:   r.kickoff_at,
      status:      r.status,
      homeScore:   r.home_score,
      awayScore:   r.away_score,
      homeTeam:    { name: r.home_team, crest: r.home_crest, slug: r.home_slug },
      awayTeam:    { name: r.away_team, crest: r.away_crest, slug: r.away_slug },
      league:      { name: r.league_name, slug: r.league_slug },
      goals:       (r.goals as number) || 0,
      assists:     (r.assists as number) || 0,
      yellowCards: (r.yellow_cards as number) || 0,
      redCards:    (r.red_cards as number) || 0,
    }));
  },
};
