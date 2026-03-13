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
    return { title: `${l.name} ${yr}/${yr+1} Fixtures · WatchKickoff` };
  } catch { return { title: 'Fixtures · WatchKickoff' }; }
}

function sortRounds(rounds: string[]): string[] {
  return [...rounds].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, '') || '0');
    const nb = parseInt(b.replace(/\D/g, '') || '0');
    if (na && nb) return na - nb;
    return a.localeCompare(b);
  });
}

function groupByDate(matches: any[]): [string, string, any[]][] {
  const map = new Map<string, { label: string; iso: string; matches: any[] }>();
  const today = new Date().toISOString().slice(0, 10);
  for (const m of matches) {
    const d = new Date(m.kickoffAt);
    const iso = d.toISOString().slice(0, 10);
    const isToday = iso === today;
    const label = isToday ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!map.has(iso)) map.set(iso, { label, iso, matches: [] });
    map.get(iso)!.matches.push(m);
  }
  return Array.from(map.values())
    .sort((a, b) => a.iso.localeCompare(b.iso))
    .map(({ label, iso, matches }) => [label, iso, matches]);
}

export default async function LeagueFixturesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { season: seasonParam, round: roundParam, group = 'by-date', team: teamSlug } = await searchParams;

  const [leagueRes, roundsRes, standingsRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueRounds(slug, seasonParam),
    getStandings(slug),
  ]);

  const league    = leagueRes.status    === 'fulfilled' ? leagueRes.value    : null;
  const allRounds = roundsRes.status    === 'fulfilled' ? sortRounds(roundsRes.value) : [];
  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value as any[] : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season  = seasonParam ?? league.season ?? '2025';
  const matches = await getLeagueMatches(slug, season, group === 'by-round' ? roundParam : undefined).catch(() => []);
  const live    = matches.filter((m: any) => isLive(m.status));

  const sorted = [...matches].sort((a: any, b: any) =>
    new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
  );

  const teams = [...standings]
    .sort((a: any, b: any) => a.position - b.position)
    .map((s: any) => ({ id: s.teamId, name: s.teamName, crest: s.teamCrest, slug: s.teamSlug }));

  const defaultTeamSlug = teamSlug ?? teams[0]?.slug;
  const selectedTeam = teams.find(t => t.slug === defaultTeamSlug) ?? teams[0] ?? null;

  // by-team matches
  const teamMatches = selectedTeam
    ? sorted.filter((m: any) => m.homeTeam.slug === selectedTeam.slug || m.awayTeam.slug === selectedTeam.slug)
    : sorted;

  // by-date — show from today onwards, group by date
  const today = new Date().toISOString().slice(0, 10);
  const dateGroups = groupByDate(sorted);

  // by-round
  const currentRoundNum = (() => {
    const upcoming = sorted.filter((m: any) => !['FINISHED','CANCELLED','POSTPONED','AWARDED'].includes(m.status));
    if (!upcoming.length) return allRounds[allRounds.length - 1] ?? null;
    const rc: Record<string, number> = {};
    for (const m of upcoming) { const r = m.round ?? ''; rc[r] = (rc[r] ?? 0) + 1; }
    return Object.entries(rc).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null;
  })();

  const activeRound = roundParam ?? currentRoundNum;
  const currentRoundIndex = activeRound ? allRounds.indexOf(activeRound) : -1;
  const prevRound = currentRoundIndex > 0 ? allRounds[currentRoundIndex - 1] : null;
  const nextRound = currentRoundIndex < allRounds.length - 1 ? allRounds[currentRoundIndex + 1] : null;

  const roundMatchesSorted = activeRound
    ? sorted.filter((m: any) => m.round === activeRound)
    : sorted;
  const roundDateGroups = groupByDate(roundMatchesSorted);

  // by-team date groups
  const teamDateGroups = groupByDate(teamMatches);

  const DIVIDER: React.CSSProperties = {
    padding: '7px 14px', background: 'var(--bg-elevated)', borderRadius: 8,
    marginBottom: 4, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
  };

  const NAV_BTN: React.CSSProperties = {
    width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-card)',
    border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 16, color: 'var(--text)',
    textDecoration: 'none', flexShrink: 0, fontWeight: 700,
  };

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <a href={`/leagues/${slug}/overview`}>{league.name}</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>Fixtures</span>
      </nav>

      <LeagueHeader league={league} activeTab="fixtures" season={season} liveCount={live.length} />

      <GroupDropdown slug={slug} season={season} group={group} teams={teams} selectedTeamSlug={defaultTeamSlug} />

      {/* By-round navigation */}
      {group === 'by-round' && allRounds.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          {prevRound
            ? <a href={`/leagues/${slug}/fixtures?season=${season}&group=by-round&round=${encodeURIComponent(prevRound)}`} style={NAV_BTN}>‹</a>
            : <div style={{ width: 34 }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
              {activeRound ? `Round ${activeRound.match(/\d+/)?.[0] ?? activeRound}` : 'All Rounds'}
            </span>
          </div>
          {nextRound
            ? <a href={`/leagues/${slug}/fixtures?season=${season}&group=by-round&round=${encodeURIComponent(nextRound)}`} style={NAV_BTN}>›</a>
            : <div style={{ width: 34 }} />}
        </div>
      )}

      {/* By-team header */}
      {group === 'by-team' && selectedTeam && teamMatches.length > 0 && (() => {
        const dates = teamMatches.map((m: any) => new Date(m.kickoffAt));
        const first = dates.reduce((a, b) => a < b ? a : b);
        const last  = dates.reduce((a, b) => a > b ? a : b);
        const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        return (
          <div style={{ padding: '8px 14px', background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
            {fmt(first)} – {fmt(last)}
          </div>
        );
      })()}

      {/* Matches */}
      {matches.length === 0
        ? <EmptyState message="No fixtures available." />
        : group === 'by-round'
          ? roundDateGroups.length === 0
            ? <EmptyState message="No matches for this round." />
            : roundDateGroups.map(([date, iso, dayMatches]) => (
                <div key={iso} style={{ marginBottom: 12 }}>
                  <div style={DIVIDER}>{date}</div>
                  {(dayMatches as any[]).map((m: any) => <MatchRow key={m.id} match={m} />)}
                </div>
              ))
          : group === 'by-team'
            ? teamDateGroups.length === 0
              ? <EmptyState message="No matches found." />
              : teamDateGroups.map(([date, iso, dayMatches]) => (
                  <div key={iso} style={{ marginBottom: 12 }}>
                    <div style={DIVIDER}>{date}</div>
                    {(dayMatches as any[]).map((m: any) => <MatchRow key={m.id} match={m} />)}
                  </div>
                ))
            : dateGroups.map(([date, iso, dayMatches]) => (
                <div key={iso} style={{ marginBottom: 12 }}>
                  <div style={DIVIDER}>{date}</div>
                  {(dayMatches as any[]).map((m: any) => <MatchRow key={m.id} match={m} />)}
                </div>
              ))
      }
    </div>
  );
}
