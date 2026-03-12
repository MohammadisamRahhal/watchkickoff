import type { Metadata } from 'next';
import { getLeagueBySlug, getStandings } from '@/lib/api';
import { StandingsTable, ErrorBanner, EmptyState } from '@/components/ui';
import { countryFlag } from '@/lib/utils';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const league = await getLeagueBySlug(slug);
    return {
      title: `${league.name} ${league.season} Standings — Table & Points`,
      description: `Full standings table for ${league.name} ${league.season}. Points, wins, draws, losses, goals and relegation zones.`,
    };
  } catch { return { title: 'Standings' }; }
}

export const revalidate = 300;

export default async function LeagueStandingsPage({ params }: Props) {
  const { slug } = await params;
  const [leagueResult, standingsResult] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getStandings(slug),
  ]);
  const league    = leagueResult.status    === 'fulfilled' ? leagueResult.value    : null;
  const standings = standingsResult.status === 'fulfilled' ? standingsResult.value : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const flag = countryFlag(league.countryCode);
  const teamNames:  Record<string, string> = {};
  const teamCrests: Record<string, string | null> = {};
  const teamSlugs:  Record<string, string> = {};
  for (const s of standings as any[]) {
    if (s.teamName)  teamNames[s.teamId]  = s.teamName;
    if (s.teamSlug)  teamSlugs[s.teamId]  = s.teamSlug;
    if (s.teamCrest) teamCrests[s.teamId] = s.teamCrest;
  }

  const tabs = [
    { id: 'fixtures',  label: 'Fixtures',  href: `/leagues/${slug}/fixtures` },
    { id: 'standings', label: 'Standings', href: `/leagues/${slug}/standings` },
    { id: 'scorers',   label: 'Scorers',   href: `/leagues/${slug}/scorers` },
  ];
  const activeTab = 'standings';

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a>
        <span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a>
        <span className="breadcrumb__sep">›</span>
        <a href={`/leagues/${slug}`}>{league.name}</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>Standings</span>
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
              {standings.length > 0 && <><span>·</span><span>{standings.length} teams</span></>}
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

      <div>
        {standings.length === 0 ? (
          <EmptyState message="Standings not available yet." />
        ) : (
          <>
            <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
              <StandingsTable rows={standings} teamNames={teamNames} teamCrests={teamCrests} teamSlugs={teamSlugs} />
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
    </div>
  );
}
