import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueMatches } from '@/lib/api';
import { MatchRow, MatchGroup, ErrorBanner, EmptyState } from '@/components/ui';
import { countryFlag, isLive, isFinished } from '@/lib/utils';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const league = await getLeagueBySlug(slug);
    return {
      title: `${league.name} ${league.season ? `${Number(league.season)}-${Number(league.season)+1}` : league.season} Fixtures & Results`,
      description: `All fixtures and results for ${league.name} ${league.season}. Live scores, upcoming matches and final results.`,
    };
  } catch { return { title: 'Fixtures' }; }
}

export const revalidate = 60;

export default async function LeagueFixturesPage({ params }: Props) {
  const { slug } = await params;
  const [leagueResult, matchesResult] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueMatches(slug),
  ]);
  const league  = leagueResult.status  === 'fulfilled' ? leagueResult.value  : null;
  const matches = matchesResult.status === 'fulfilled' ? matchesResult.value : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const flag     = countryFlag(league.countryCode);
  const live     = matches.filter((m: any) => isLive(m.status));
  const finished = matches.filter((m: any) => isFinished(m.status));
  const upcoming = matches.filter((m: any) => !isLive(m.status) && !isFinished(m.status));

  const tabs = [
    { id: 'fixtures',  label: 'Fixtures',  href: `/leagues/${slug}/fixtures` },
    { id: 'standings', label: 'Standings', href: `/leagues/${slug}/standings` },
    { id: 'scorers',   label: 'Scorers',   href: `/leagues/${slug}/scorers` },
  ];
  const activeTab = 'fixtures';

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a>
        <span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a>
        <span className="breadcrumb__sep">›</span>
        <a href={`/leagues/${slug}`}>{league.name}</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>Fixtures</span>
      </nav>

      <div className="match-hero" style={{ marginBottom: 20, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{league.logo ? <img src={league.logo} alt={league.name} style={{ width: 48, height: 48, objectFit: "contain" }} /> : <span style={{ fontSize: 40 }}>{flag}</span>}</div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1 }}>
              {league.name.toUpperCase()}
            </h1>
            <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 13, display: 'flex', gap: 12 }}>
              <span>{league.season ? `${Number(league.season)}-${Number(league.season)+1}` : ''}</span>
              <span>·</span>
              <span>{league.type}</span>
              {live.length > 0 && <><span>·</span><span style={{ color: 'var(--green)' }}>🔴 {live.length} LIVE</span></>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {tabs.map(({ id, label, href }) => (
          <a key={id} href={href} style={{
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.06em', padding: '10px 20px',
            color: activeTab === id ? 'var(--text)' : 'var(--text-dim)',
            borderBottom: activeTab === id ? '2px solid var(--green)' : '2px solid transparent',
            marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {label.toUpperCase()}
          </a>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {matches.length === 0 ? (
          <EmptyState message="No fixtures available for this league." />
        ) : (
          <>
            {live.length > 0 && <MatchGroup label="Live Now" flag="🔴" count={live.length}>{live.map((m: any) => <MatchRow key={m.id} match={m} />)}</MatchGroup>}
            {upcoming.length > 0 && <MatchGroup label="Upcoming" flag="🗓" count={upcoming.length}>{upcoming.map((m: any) => <MatchRow key={m.id} match={m} />)}</MatchGroup>}
            {finished.length > 0 && <MatchGroup label="Results" flag="✓" count={finished.length}>{finished.map((m: any) => <MatchRow key={m.id} match={m} />)}</MatchGroup>}
          </>
        )}
      </div>
    </div>
  );
}
