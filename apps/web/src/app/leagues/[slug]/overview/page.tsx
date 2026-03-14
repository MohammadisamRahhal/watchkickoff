import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueMatches, getStandings, getLeagueTopScorers } from '@/lib/api';
import { MatchRow, ErrorBanner, TeamCrest } from '@/components/ui';
import { isLive, isFinished, countryFlag } from '@/lib/utils';
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

function SectionCard({ title, href, linkLabel, children }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{title}</span>
        {href && <a href={href} style={{ fontSize: 12, color: 'var(--blue-bright)', textDecoration: 'none', fontWeight: 600 }}>{linkLabel ?? 'All →'}</a>}
      </div>
      {children}
    </div>
  );
}

function FormDot({ result }: { result: string }) {
  const colors: Record<string, string> = { W: '#22c55e', D: '#f59e0b', L: '#ef4444' };
  return (
    <span style={{ width: 16, height: 16, borderRadius: '50%', background: colors[result] ?? '#e5e7eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{result}</span>
  );
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
  const allM      = matchesRes.status   === 'fulfilled' ? matchesRes.value as any[]  : [];
  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value as any[] : [];
  const scorers   = scorersRes.status   === 'fulfilled' ? scorersRes.value as any[]  : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season = league.season ?? '2025';
  const live = allM.filter((m: any) => isLive(m.status));
  const finished = [...allM].filter((m: any) => isFinished(m.status))
    .sort((a: any, b: any) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime());
  const upcoming = [...allM].filter((m: any) => !isLive(m.status) && !isFinished(m.status))
    .sort((a: any, b: any) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());

  const nextRound = upcoming[0]?.round ?? null;
  const nextRoundMatches = nextRound
    ? upcoming.filter((m: any) => m.round === nextRound)
    : upcoming.slice(0, 8);
  const recentResults = finished.slice(0, 5);
  const sortedStandings = [...standings].sort((a, b) => a.position - b.position);

  // Stats
  const totalGoals = finished.reduce((sum: number, m: any) => sum + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const avgGoals = finished.length > 0 ? (totalGoals / finished.length).toFixed(2) : '0';
  const homeWins = finished.filter((m: any) => (m.homeScore ?? 0) > (m.awayScore ?? 0)).length;
  const draws = finished.filter((m: any) => m.homeScore === m.awayScore).length;
  const awayWins = finished.length - homeWins - draws;

  const ZONE_COLORS: Record<string, string> = { PROMOTION: '#3b82f6', CHAMPIONSHIP: '#f97316', RELEGATION: '#ef4444' };

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <span>{league.name}</span>
      </nav>

      <LeagueHeader league={league} activeTab="overview" season={season} liveCount={live.length} />

      {/* Season stats bar */}
      {finished.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Matches Played', value: finished.length },
            { label: 'Goals Scored', value: totalGoals },
            { label: 'Avg Goals/Game', value: avgGoals },
            { label: 'Home / Draw / Away', value: `${homeWins} / ${draws} / ${awayWins}` },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ padding: '12px 14px', textAlign: 'center' as const }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.04em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="league-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>

          {/* Live */}
          {live.length > 0 && (
            <SectionCard title="🔴 Live Now" href={`/leagues/${slug}/fixtures`}>
              {live.map((m: any) => <MatchRow key={m.id} match={m} />)}
            </SectionCard>
          )}

          {/* Next fixtures */}
          {nextRoundMatches.length > 0 && (
            <SectionCard
              title={nextRound ? `Next · ${nextRound}` : 'Upcoming Fixtures'}
              href={`/leagues/${slug}/fixtures`}
            >
              {nextRoundMatches.map((m: any) => <MatchRow key={m.id} match={m} />)}
            </SectionCard>
          )}

          {/* Recent results */}
          {recentResults.length > 0 && (
            <SectionCard title="Recent Results" href={`/leagues/${slug}/fixtures`}>
              {recentResults.map((m: any) => <MatchRow key={m.id} match={m} />)}
            </SectionCard>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>

          {/* Standings mini */}
          {sortedStandings.length > 0 && (
            <SectionCard title="Standings" href={`/leagues/${slug}/standings`} linkLabel="Full table →">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Team', 'P', 'W', 'D', 'L', 'PTS'].map((h, i) => (
                      <th key={h} style={{ padding: '8px 8px', textAlign: i < 2 ? 'left' as const : 'center' as const, fontSize: 11, fontWeight: 700, color: h === 'PTS' ? 'var(--blue-bright)' : 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedStandings.slice(0, 8).map((row: any) => {
                    const zoneColor = ZONE_COLORS[row.zone ?? ''];
                    const form: string[] = row.form ? row.form.split('') : [];
                    return (
                      <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 8px', position: 'relative' }}>
                          {zoneColor && <span style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, borderRadius: 2, background: zoneColor }} />}
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 6 }}>{row.position}</span>
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <a href={`/teams/${row.teamSlug}/fixtures`} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text)' }}>
                            <TeamCrest url={row.teamCrest ?? null} name={row.teamName ?? ''} size={18} />
                            <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 90 }}>{row.teamName}</span>
                          </a>
                        </td>
                        <td style={{ textAlign: 'center' as const, color: 'var(--text-muted)', padding: '8px 5px' }}>{row.played}</td>
                        <td style={{ textAlign: 'center' as const, color: 'var(--text-muted)', padding: '8px 5px' }}>{row.wins}</td>
                        <td style={{ textAlign: 'center' as const, color: 'var(--text-muted)', padding: '8px 5px' }}>{row.draws}</td>
                        <td style={{ textAlign: 'center' as const, color: 'var(--text-muted)', padding: '8px 5px' }}>{row.losses}</td>
                        <td style={{ textAlign: 'center' as const, fontWeight: 700, color: 'var(--text)', padding: '8px 5px' }}>{row.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </SectionCard>
          )}

          {/* Top Scorers mini */}
          {scorers.length > 0 && (
            <SectionCard title="Top Scorers" href={`/leagues/${slug}/scorers`} linkLabel="All →">
              {(scorers as any[]).slice(0, 5).map((s: any, i: number) => (
                <div key={s.playerId ?? i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', width: 16, textAlign: 'center' as const, flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={`/players/${s.playerSlug}`} style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{s.playerName}</a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <TeamCrest url={s.teamCrest ?? null} name={s.teamName ?? ''} size={14} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.teamName}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' as const }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{s.goals}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>G</div>
                    </div>
                    <div style={{ textAlign: 'center' as const }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1 }}>{s.assists}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>A</div>
                    </div>
                  </div>
                </div>
              ))}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
