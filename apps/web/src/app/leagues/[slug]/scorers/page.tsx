import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueScorers } from '@/lib/api';
import { ErrorBanner, EmptyState, TeamCrest } from '@/components/ui';
import LeagueHeader from '@/components/LeagueHeader';

export const revalidate = 3600;
interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const l = await getLeagueBySlug(slug);
    return { title: `${l.name} Top Scorers` };
  } catch { return { title: 'Scorers' }; }
}

export default async function ScorersPage({ params }: Props) {
  const { slug } = await params;

  const [leagueRes, scorersRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueScorers(slug),
  ]);

  const league  = leagueRes.status  === 'fulfilled' ? leagueRes.value  : null;
  const scorers = scorersRes.status === 'fulfilled' ? scorersRes.value : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season = league.season ?? '2025';

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <a href={`/leagues/${slug}/overview`} style={{ color: 'var(--text-muted)' }}>{league.name}</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>Scorers</span>
      </nav>

      <LeagueHeader league={league} activeTab="scorers" season={season} />

      {scorers.length === 0 ? (
        <EmptyState message="No scorers data available." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', width: 36 }}>#</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Player</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Team</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', width: 50 }}>Apps</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', width: 50 }}>G</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', width: 50 }}>A</th>
              </tr>
            </thead>
            <tbody>
              {(scorers as any[]).map((s: any, i: number) => (
                <tr key={s.playerId ?? i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', color: 'var(--text-dim)', fontSize: 13, fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <a href={`/players/${s.playerSlug}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>
                      {s.playerName}
                    </a>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TeamCrest url={s.teamCrest ?? null} name={s.teamName ?? ''} size={20} />
                      <a href={`/teams/${s.teamSlug}/fixtures`} style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: 13 }}>
                        {s.teamName}
                      </a>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{s.appearances ?? '-'}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: 15, color: 'var(--green)' }}>{s.goals}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>{s.assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
