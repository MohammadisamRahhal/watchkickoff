import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueMatches, getLeagueRounds, getStandings } from '@/lib/api';
import { MatchRow, ErrorBanner, EmptyState } from '@/components/ui';
import { isLive } from '@/lib/utils';
import LeagueHeader from '@/components/LeagueHeader';
import GroupDropdown from '@/components/GroupDropdown';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string; round?: string; group?: string; team?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const l = await getLeagueBySlug(slug);
    const yr = Number(l.season ?? 2025);
    return { title: `${l.name} ${yr}/${yr+1} Fixtures & Results · WatchKickoff` };
  } catch { return { title: 'Fixtures · WatchKickoff' }; }
}

function sortRounds(rounds: string[]): string[] {
  return [...rounds].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, "") || "0");
    const nb = parseInt(b.replace(/\D/g, "") || "0");
    if (na && nb) return na - nb;
    return a.localeCompare(b);
  });
}

function groupByDate(matches: any[]): [string, any[]][] {
  const map = new Map<string, any[]>();
  for (const m of matches) {
    const d = new Date(m.kickoffAt);
    const key = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries());
}

function groupByRound(matches: any[]): Record<string, any[]> {
  const map: Record<string, any[]> = {};
  for (const m of matches) {
    const r = m.round ?? "Other";
    if (!map[r]) map[r] = [];
    map[r].push(m);
  }
  return map;
}

export default async function LeagueFixturesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { season: seasonParam, round: roundParam, group = "by-date", team: teamSlug } = await searchParams;

  const [leagueRes, roundsRes, standingsRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueRounds(slug, seasonParam),
    getStandings(slug),
  ]);

  const league    = leagueRes.status    === "fulfilled" ? leagueRes.value    : null;
  const allRounds = roundsRes.status    === "fulfilled" ? sortRounds(roundsRes.value) : [];
  const standings = standingsRes.status === "fulfilled" ? standingsRes.value as any[] : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season  = seasonParam ?? league.season ?? "2025";
  const matches = await getLeagueMatches(slug, season, roundParam).catch(() => []);
  const live    = matches.filter((m: any) => isLive(m.status));

  const sorted = [...matches].sort((a: any, b: any) =>
    new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
  );

  // by-team filter
  const teams = [...standings]
    .sort((a, b) => a.position - b.position)
    .map((s: any) => ({ id: s.teamId, name: s.teamName, crest: s.teamCrest, slug: s.teamSlug }));

  const defaultTeamSlug = teamSlug ?? teams[0]?.slug;
  const selectedTeam = teams.find(t => t.slug === defaultTeamSlug) ?? teams[0] ?? null;
  const teamMatches = selectedTeam
    ? sorted.filter((m: any) => m.homeTeam.slug === selectedTeam.slug || m.awayTeam.slug === selectedTeam.slug)
    : sorted;

  const byDate  = groupByDate(group === "by-team" || group === "by-date" ? teamMatches : sorted);
  const byRound = groupByRound(sorted);

  // current round — find round with most upcoming matches
  const currentRoundNum = (() => {
    const upcoming = sorted.filter((m: any) => !["FINISHED","CANCELLED","POSTPONED","AWARDED"].includes(m.status));
    if (!upcoming.length) return allRounds[allRounds.length - 1] ?? null;
    const roundCounts: Record<string, number> = {};
    for (const m of upcoming) { const r = m.round ?? ""; roundCounts[r] = (roundCounts[r] ?? 0) + 1; }
    return Object.entries(roundCounts).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null;
  })();

  const activeRound = roundParam ?? currentRoundNum;
  const currentRoundIndex = activeRound ? allRounds.indexOf(activeRound) : -1;
  const prevRound = currentRoundIndex > 0 ? allRounds[currentRoundIndex - 1] : null;
  const nextRound = currentRoundIndex < allRounds.length - 1 ? allRounds[currentRoundIndex + 1] : null;

  const roundMatches = activeRound ? (groupByRound(sorted)[activeRound] ?? []) : [];
  const roundByDate = groupByDate([...roundMatches].sort((a:any,b:any) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()));

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <a href={`/leagues/${slug}/overview`}>{league.name}</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: "var(--text-muted)" }}>Fixtures</span>
      </nav>

      <LeagueHeader league={league} activeTab="fixtures" season={season} liveCount={live.length} />

      {/* Group Dropdown — FotMob style */}
      <GroupDropdown
        slug={slug}
        season={season}
        group={group}
        teams={teams}
        selectedTeamSlug={defaultTeamSlug}
        roundParam={roundParam}
      />

      {/* By round navigation */}
      {group === "by-round" && allRounds.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "10px 0" }}>
          {prevRound ? (
            <a href={`/leagues/${slug}/fixtures?season=${season}&group=by-round&round=${encodeURIComponent(prevRound)}`}
              style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--text)", textDecoration: "none", flexShrink: 0 }}>‹</a>
          ) : <div style={{ width: 32 }} />}
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              {activeRound ? `Round ${activeRound.match(/\d+/)?.[0] ?? activeRound}` : "All Rounds"}
            </span>
          </div>
          {nextRound ? (
            <a href={`/leagues/${slug}/fixtures?season=${season}&group=by-round&round=${encodeURIComponent(nextRound)}`}
              style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--text)", textDecoration: "none", flexShrink: 0 }}>›</a>
          ) : <div style={{ width: 32 }} />}
        </div>
      )}

      {/* By team header */}
      {group === "by-team" && selectedTeam && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 14px", background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border)" }}>
          {selectedTeam.crest && <img src={selectedTeam.crest} style={{ width: 28, height: 28, objectFit: "contain" }} alt="" />}
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>{selectedTeam.name}</span>
        </div>
      )}

      {/* Matches */}
      {(group === "by-team" ? teamMatches : matches).length === 0
        ? <EmptyState message="No fixtures available." />
        : group === "by-round"
          ? roundByDate.length === 0
            ? <EmptyState message="No matches for this round." />
            : roundByDate.map(([date, dayMatches]) => (
                <div key={date} style={{ marginBottom: 12 }}>
                  <div style={{ padding: "7px 14px", background: "var(--bg-elevated)", borderRadius: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>{date}</span>
                  </div>
                  {(dayMatches as any[]).map((m: any) => <MatchRow key={m.id} match={m} />)}
                </div>
              ))
          : byDate.map(([date, dayMatches]) => (
              <div key={date} style={{ marginBottom: 12 }}>
                <div style={{ padding: "7px 14px", background: "var(--bg-elevated)", borderRadius: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>{date}</span>
                </div>
                {(dayMatches as any[]).map((m: any) => <MatchRow key={m.id} match={m} />)}
              </div>
            ))
      }
    </div>
  );
}
