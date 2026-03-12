import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueScorers } from '@/lib/api';
import { ErrorBanner, EmptyState, TeamCrest } from '@/components/ui';
import { countryFlag } from '@/lib/utils';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const league = await getLeagueBySlug(slug);
    return {
      title: `${league.name} ${league.season} Top Scorers — Goals & Assists`,
      description: `Top scorers for ${league.name} ${league.season}. Goals, assists and appearances for all players.`,
    };
  } catch { return { title: 'Top Scorers' }; }
}

export const revalidate = 300;

export default async function LeagueScorersPage({ params }: Props) {
  const { slug } = await params;
  const [leagueResult, scorersResult] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueScorers(slug),
  ]);
  const league  = leagueResult.status  === 'fulfilled' ? leagueResult.value  : null;
  const scorers = scorersResult.status === 'fulfilled' ? scorersResult.value : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const flag = countryFlag(league.countryCode);

  const tabs = [
    { id: 'fixtures',  label: 'Fixtures',  href: `/leagues/${slug}/fixtures` },
    { id: 'standings', label: 'Standings', href: `/leagues/${slug}/standings` },
    { id: 'scorers',   label: 'Scorers',   href: `/leagues/${slug}/scorers` },
  ];
  const activeTab = 'scorers';

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a>
        <span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a>
        <span className="breadcrumb__sep">›</span>
        <a href={`/leagues/${slug}`}>{league.name}</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>Top Scorers</span>
      </nav>

      <div className="match-hero" style={{ marginBottom: 20, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{league.logo ? <img src={league.logo} alt={league.name} style={{ width: 48, height: 48, objectFit: "contain" }} /> : <span style={{ fontSize: 40 }}>{flag}</span>}</div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1 }}>
              {league.name.toUpperCase()}
            </h1>
            <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 13, display: 'flex', gap: 12 }}>
              <span>{league.season}</span>
              <span>·</span>
              <span>{league.type}</span>
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

      <div className="card" style={{ overflow: 'hidden' }}>
        {scorers.length === 0 ? (
          <EmptyState message="Top scorers data not available yet." />
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 160px 52px 52px 52px', alignItems: 'center', padding: '8px 16px', borderBottom: '2px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', textAlign: 'center' }}>#</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>PLAYER</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>TEAM</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)', textAlign: 'center' }}>G</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', textAlign: 'center' }}>A</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', textAlign: 'center' }}>MP</span>
            </div>
            {(scorers as any[]).map((s, i) => (
              <div key={s.playerId} className="match-row" style={{ display: 'grid', gridTemplateColumns: '40px 1fr 160px 52px 52px 52px', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ textAlign: 'center' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ fontSize: 13, color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>{i + 1}</span>}
                </div>
                <a href={`/players/${s.playerSlug}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.playerName}
                </a>
                <a href={`/teams/${s.teamSlug}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', overflow: 'hidden' }}>
                  <TeamCrest url={s.teamCrest} name={s.teamName} size={18} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.teamName}</span>
                </a>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--green)', fontSize: 17 }}>{s.goals}</div>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-muted)' }}>{s.assists}</div>
                <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-dim)' }}>{s.appearances}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
