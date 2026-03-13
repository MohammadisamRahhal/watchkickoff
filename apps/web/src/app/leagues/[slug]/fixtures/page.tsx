import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueMatches, getLeagueRounds } from '@/lib/api';
import { MatchRow, ErrorBanner, EmptyState } from '@/components/ui';
import { isLive } from '@/lib/utils';
import LeagueHeader from '@/components/LeagueHeader';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string; round?: string; group?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const l = await getLeagueBySlug(slug);
    const yr = Number(l.season ?? 2025);
    return { title: `${l.name} ${yr}/${yr+1} Fixtures` };
  } catch { return { title: 'Fixtures' }; }
}

function sortRounds(rounds: string[]): string[] {
  return [...rounds].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, '') || '0');
    const nb = parseInt(b.replace(/\D/g, '') || '0');
    if (na && nb) return na - nb;
    return a.localeCompare(b);
  });
}

function groupByDate(matches: any[]): [string, any[]][] {
  const map = new Map<string, any[]>();
  for (const m of matches) {
    const d = new Date(m.kickoffAt);
    const key = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries());
}

function groupByRound(matches: any[]): Record<string, any[]> {
  const map: Record<string, any[]> = {};
  for (const m of matches) {
    const r = m.round ?? 'Other';
    if (!map[r]) map[r] = [];
    map[r].push(m);
  }
  return map;
}

const PILL: React.CSSProperties = {
  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
  textDecoration: 'none', border: '1px solid var(--border)', whiteSpace: 'nowrap',
};

export default async function LeagueFixturesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { season: seasonParam, round: roundParam, group = 'by-date' } = await searchParams;

  const [leagueRes, roundsRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueRounds(slug, seasonParam),
  ]);

  const league   = leagueRes.status  === 'fulfilled' ? leagueRes.value  : null;
  const allRounds = roundsRes.status === 'fulfilled' ? sortRounds(roundsRes.value) : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season  = seasonParam ?? league.season ?? '2025';
  const matches = await getLeagueMatches(slug, season, roundParam).catch(() => []);
  const live    = matches.filter((m: any) => isLive(m.status));

  const sorted = [...matches].sort((a: any, b: any) =>
    new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
  );

  const byDate  = groupByDate(sorted);
  const byRound = groupByRound(sorted);

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <a href={`/leagues/${slug}/overview`} style={{ color: 'var(--text-muted)' }}>{league.name}</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>Fixtures</span>
      </nav>

      <LeagueHeader league={league} activeTab="fixtures" season={season} liveCount={live.length} />

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <a href={`/leagues/${slug}/fixtures?season=${season}&group=by-date`} style={{
          ...PILL,
          background: group !== 'by-round' ? 'var(--surface-2)' : 'transparent',
          color: group !== 'by-round' ? 'var(--text)' : 'var(--text-muted)',
        }}>By date</a>
        <a href={`/leagues/${slug}/fixtures?season=${season}&group=by-round`} style={{
          ...PILL,
          background: group === 'by-round' ? 'var(--surface-2)' : 'transparent',
          color: group === 'by-round' ? 'var(--text)' : 'var(--text-muted)',
        }}>By round</a>
      </div>

      {/* Round pills — by-round only */}
      {group === 'by-round' && allRounds.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
          <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
            <a href={`/leagues/${slug}/fixtures?season=${season}&group=by-round`} style={{
              ...PILL,
              background: !roundParam ? 'var(--green)' : 'var(--surface-2)',
              color: !roundParam ? '#000' : 'var(--text-muted)',
            }}>All</a>
            {allRounds.map(r => {
              const num = r.match(/\d+/)?.[0] ?? r;
              const active = roundParam === r;
              return (
                <a key={r}
                  href={`/leagues/${slug}/fixtures?season=${season}&group=by-round&round=${encodeURIComponent(r)}`}
                  style={{ ...PILL, background: active ? 'var(--green)' : 'var(--surface-2)', color: active ? '#000' : 'var(--text-muted)' }}>
                  R{num}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Matches */}
      {matches.length === 0
        ? <EmptyState message="No fixtures available." />
        : group === 'by-round'
          ? sortRounds(Object.keys(byRound)).map(round => {
              const num = round.match(/\d+/)?.[0] ?? '';
              return (
                <div key={round} style={{ marginBottom: 16 }}>
                  <div style={{ padding: '8px 14px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      {num ? `ROUND ${num}` : round.toUpperCase()}
                    </span>
                    {!roundParam && (
                      <a href={`/leagues/${slug}/fixtures?season=${season}&group=by-round&round=${encodeURIComponent(round)}`}
                        style={{ fontSize: 11, color: 'var(--green)', textDecoration: 'none' }}>View all →</a>
                    )}
                  </div>
                  {byRound[round].map((m: any) => <MatchRow key={m.id} match={m} />)}
                </div>
              );
            })
          : byDate.map(([date, dayMatches]) => (
              <div key={date} style={{ marginBottom: 16 }}>
                <div style={{ padding: '8px 14px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    {date.toUpperCase()}
                  </span>
                </div>
                {dayMatches.map((m: any) => <MatchRow key={m.id} match={m} />)}
              </div>
            ))
      }
    </div>
  );
}
