import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueMatches, getStandings } from '@/lib/api';
import { StandingsTable, ErrorBanner, EmptyState } from '@/components/ui';
import LeagueHeader from '@/components/LeagueHeader';

export const revalidate = 300;
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const l = await getLeagueBySlug(slug);
    const yr = Number(l.season ?? 2025);
    return { title: `${l.name} ${yr}/${yr+1} Standings · WatchKickoff` };
  } catch { return { title: 'Standings · WatchKickoff' }; }
}

function calcHomeAway(matches: any[], standings: any[]) {
  const home: Record<string, any> = {};
  const away: Record<string, any> = {};
  for (const s of standings) {
    home[s.teamId] = { w:0, d:0, l:0, gf:0, ga:0, pts:0 };
    away[s.teamId] = { w:0, d:0, l:0, gf:0, ga:0, pts:0 };
  }
  for (const m of matches) {
    if (!['FINISHED','AWARDED'].includes(m.status)) continue;
    const hid = m.homeTeamId, aid = m.awayTeamId;
    const hs = m.homeScore ?? 0, as_ = m.awayScore ?? 0;
    if (home[hid]) {
      home[hid].gf += hs; home[hid].ga += as_;
      if (hs > as_) { home[hid].w++; home[hid].pts += 3; }
      else if (hs === as_) { home[hid].d++; home[hid].pts++; }
      else home[hid].l++;
    }
    if (away[aid]) {
      away[aid].gf += as_; away[aid].ga += hs;
      if (as_ > hs) { away[aid].w++; away[aid].pts += 3; }
      else if (as_ === hs) { away[aid].d++; away[aid].pts++; }
      else away[aid].l++;
    }
  }
  return { home, away };
}

const FILTER_BTN = (active: boolean) => ({
  padding: '7px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600,
  textDecoration: 'none', border: '1px solid var(--border)',
  background: active ? '#1e40af' : 'var(--bg-card)',
  color: active ? '#fff' : 'var(--text-muted)',
} as React.CSSProperties);

export default async function StandingsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { filter = 'all' } = await searchParams;

  const [leagueRes, standingsRes, matchesRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getStandings(slug),
    getLeagueMatches(slug, '2025'),
  ]);

  const league    = leagueRes.status    === 'fulfilled' ? leagueRes.value    : null;
  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value as any[] : [];
  const matches   = matchesRes.status   === 'fulfilled' ? matchesRes.value   as any[] : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season = league.season ?? '2025';
  const { home, away } = calcHomeAway(matches, standings);
  const sorted = [...standings].sort((a, b) => a.position - b.position);

  const filteredRows = sorted.map((row: any) => {
    if (filter === 'home') {
      const h = home[row.teamId] ?? { w:0, d:0, l:0, gf:0, ga:0, pts:0 };
      return { ...row, wins:h.w, draws:h.d, losses:h.l, goalsFor:h.gf, goalsAgainst:h.ga, goalDiff:h.gf-h.ga, points:h.pts, played:h.w+h.d+h.l };
    }
    if (filter === 'away') {
      const a = away[row.teamId] ?? { w:0, d:0, l:0, gf:0, ga:0, pts:0 };
      return { ...row, wins:a.w, draws:a.d, losses:a.l, goalsFor:a.gf, goalsAgainst:a.ga, goalDiff:a.gf-a.ga, points:a.pts, played:a.w+a.d+a.l };
    }
    return row;
  }).sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);

  const teamNames: Record<string, string> = {};
  const teamCrests: Record<string, string|null> = {};
  const teamSlugs: Record<string, string> = {};
  for (const s of sorted) {
    if (s.teamName)  teamNames[s.teamId]  = s.teamName;
    if (s.teamSlug)  teamSlugs[s.teamId]  = s.teamSlug;
    if (s.teamCrest) teamCrests[s.teamId] = s.teamCrest;
  }

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <a href={`/leagues/${slug}/overview`}>{league.name}</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>Standings</span>
      </nav>

      <LeagueHeader league={league} activeTab="standings" season={season} />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <a href={`/leagues/${slug}/standings`} style={FILTER_BTN(filter === 'all')}>All</a>
        <a href={`/leagues/${slug}/standings?filter=home`} style={FILTER_BTN(filter === 'home')}>Home</a>
        <a href={`/leagues/${slug}/standings?filter=away`} style={FILTER_BTN(filter === 'away')}>Away</a>
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState message="Standings not available yet." />
      ) : (
        <>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
            <StandingsTable rows={filteredRows as any} teamNames={teamNames} teamCrests={teamCrests} teamSlugs={teamSlugs} />
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
            {[
              { cls: 'zone-promotion',    label: 'Promotion / Champions League' },
              { cls: 'zone-championship', label: 'Europa / Playoff' },
              { cls: 'zone-relegation',   label: 'Relegation' },
            ].map(({ cls, label }) => (
              <span key={cls} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={cls} style={{ display: 'inline-block', width: 3, height: 14, borderRadius: 2 }} />
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
