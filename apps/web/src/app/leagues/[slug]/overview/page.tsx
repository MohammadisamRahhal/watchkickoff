import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueMatches, getStandings, getLeagueTopScorers } from '@/lib/api';
import { MatchRow, ErrorBanner } from '@/components/ui';
import { isLive, isFinished } from '@/lib/utils';
import LeagueHeader from '@/components/LeagueHeader';

export const revalidate = 60;
interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const l = await getLeagueBySlug(slug);
    const yr = Number(l.season ?? 2025);
    return { title: `${l.name} ${yr}/${yr+1} — Overview · WatchKickoff` };
  } catch { return { title: 'League Overview · WatchKickoff' }; }
}

export default async function LeagueOverviewPage({ params }: Props) {
  const { slug } = await params;

  const [leagueRes, matchesRes, standingsRes, scorersRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueMatches(slug, '2025'),
    getStandings(slug),
    getLeagueTopScorers(slug),
  ]);

  const league    = leagueRes.status    === 'fulfilled' ? leagueRes.value    : null;
  const allM      = matchesRes.status   === 'fulfilled' ? matchesRes.value   : [];
  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value : [];
  const scorers   = scorersRes.status   === 'fulfilled' ? scorersRes.value   : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season = league.season ?? '2025';
  const live    = allM.filter((m: any) => isLive(m.status));
  const finished = [...allM].filter((m: any) => isFinished(m.status))
    .sort((a: any, b: any) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime());
  const upcoming = [...allM].filter((m: any) => !isLive(m.status) && !isFinished(m.status))
    .sort((a: any, b: any) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());

  // جولة قادمة — كل مباريات نفس الـ round
  const nextRound = upcoming[0]?.round ?? null;
  const nextRoundMatches = nextRound
    ? upcoming.filter((m: any) => m.round === nextRound)
    : upcoming.slice(0, 5);

  const recentResults = finished.slice(0, 5);
  const sortedStandings = [...standings as any[]].sort((a, b) => a.position - b.position);

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <span>{league.name}</span>
      </nav>

      <LeagueHeader league={league} activeTab="overview" season={season} liveCount={live.length} />

      <div className="league-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {live.length > 0 && (
            <section className="match-hero" style={{ padding: '14px 0' }}>
              <div style={{ padding: '0 16px 10px', fontSize: 11, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.08em' }}>🔴 LIVE NOW</div>
              {live.map((m: any) => <MatchRow key={m.id} match={m} />)}
            </section>
          )}

          {nextRoundMatches.length > 0 && (
            <section className="match-hero" style={{ padding: '14px 0' }}>
              <div style={{ padding: '0 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                  {nextRound ? `NEXT · ${nextRound.toUpperCase()}` : 'UPCOMING'}
                </span>
                <a href={`/leagues/${slug}/fixtures`} style={{ fontSize: 11, color: 'var(--green)', textDecoration: 'none' }}>All →</a>
              </div>
              {nextRoundMatches.map((m: any) => <MatchRow key={m.id} match={m} />)}
            </section>
          )}

          {recentResults.length > 0 && (
            <section className="match-hero" style={{ padding: '14px 0' }}>
              <div style={{ padding: '0 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>RECENT RESULTS</span>
                <a href={`/leagues/${slug}/fixtures`} style={{ fontSize: 11, color: 'var(--green)', textDecoration: 'none' }}>All →</a>
              </div>
              {recentResults.map((m: any) => <MatchRow key={m.id} match={m} />)}
            </section>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {sortedStandings.length > 0 && (
            <section className="match-hero" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>STANDINGS</span>
                <a href={`/leagues/${slug}/standings`} style={{ fontSize: 11, color: 'var(--green)', textDecoration: 'none' }}>Full table →</a>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 280 }}>
                  <thead>
                    <tr style={{ color: 'var(--text-dim)', fontSize: 11, borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '4px 4px', width: 22 }}>#</th>
                      <th style={{ textAlign: 'left', padding: '4px 4px' }}>Team</th>
                      <th style={{ textAlign: 'center', padding: '4px 5px' }}>P</th>
                      <th style={{ textAlign: 'center', padding: '4px 5px' }}>W</th>
                      <th style={{ textAlign: 'center', padding: '4px 5px' }}>D</th>
                      <th style={{ textAlign: 'center', padding: '4px 5px' }}>L</th>
                      <th style={{ textAlign: 'center', padding: '4px 5px', color: 'var(--text)', fontWeight: 700 }}>PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStandings.slice(0, 6).map((row: any) => (
                      <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '7px 4px', color: 'var(--text-dim)', fontSize: 12 }}>{row.position}</td>
                        <td style={{ padding: '7px 4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {row.teamCrest && <img src={row.teamCrest} style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} alt="" />}
                            <a href={`/teams/${row.teamSlug}/fixtures`} style={{ color: 'var(--text)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{row.teamName}</a>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '7px 5px' }}>{row.played}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '7px 5px' }}>{row.wins}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '7px 5px' }}>{row.draws}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '7px 5px' }}>{row.losses}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text)', padding: '7px 5px' }}>{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {scorers.length > 0 && (
            <section className="match-hero" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>TOP SCORERS</span>
                <a href={`/leagues/${slug}/scorers`} style={{ fontSize: 11, color: 'var(--green)', textDecoration: 'none' }}>All →</a>
              </div>
              {(scorers as any[]).slice(0, 5).map((s: any, i: number) => (
                <div key={s.playerId ?? i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', width: 18, textAlign: 'right', flexShrink: 0 }}>{i+1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={`/players/${s.playerSlug}`} style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.playerName}</a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      {s.teamCrest && <img src={s.teamCrest} style={{ width: 14, height: 14, objectFit: 'contain' }} alt="" />}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.teamName}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>{s.goals}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>G</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{s.assists}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>A</div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
