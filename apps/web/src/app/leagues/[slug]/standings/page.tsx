import type { Metadata } from 'next';
import { getLeagueBySlug, getStandings } from '@/lib/api';
import { StandingsTable, ErrorBanner, EmptyState } from '@/components/ui';
import LeagueHeader from '@/components/LeagueHeader';

export const revalidate = 300;
interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const l = await getLeagueBySlug(slug);
    return { title: `${l.name} Standings` };
  } catch { return { title: 'Standings' }; }
}

export default async function StandingsPage({ params }: Props) {
  const { slug } = await params;

  const [leagueRes, standingsRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getStandings(slug),
  ]);

  const league    = leagueRes.status    === 'fulfilled' ? leagueRes.value    : null;
  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season = league.season ?? '2025';
  const teamNames:  Record<string, string>         = {};
  const teamCrests: Record<string, string | null>  = {};
  const teamSlugs:  Record<string, string>         = {};
  for (const s of standings as any[]) {
    if (s.teamName)  teamNames[s.teamId]  = s.teamName;
    if (s.teamSlug)  teamSlugs[s.teamId]  = s.teamSlug;
    if (s.teamCrest) teamCrests[s.teamId] = s.teamCrest;
  }

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <a href={`/leagues/${slug}/overview`} style={{ color: 'var(--text-muted)' }}>{league.name}</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>Standings</span>
      </nav>

      <LeagueHeader league={league} activeTab="standings" season={season} />

      {standings.length === 0 ? (
        <EmptyState message="Standings not available yet." />
      ) : (
        <>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
            <StandingsTable rows={standings as any} teamNames={teamNames} teamCrests={teamCrests} teamSlugs={teamSlugs} />
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
