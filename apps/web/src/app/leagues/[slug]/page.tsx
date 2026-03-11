import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueMatches, getStandings, getLeagueScorers } from '@/lib/api';
import { MatchRow, MatchGroup, StandingsTable, ErrorBanner, EmptyState, TeamCrest } from '@/components/ui';
import { countryFlag, formatDate, isLive, isFinished } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const league = await getLeagueBySlug(slug);
    return {
      title: `${league.name} ${league.season} — Fixtures, Standings & Scorers`,
      description: `Live scores, fixtures, results, standings and top scorers for ${league.name} ${league.season}.`,
    };
  } catch { return { title: 'League' }; }
}

export const revalidate = 300;

export default async function LeaguePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab = 'fixtures' } = await searchParams;

  const [leagueResult, matchesResult, standingsResult, scorersResult] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueMatches(slug),
    getStandings(slug),
    getLeagueScorers(slug),
  ]);

  const league    = leagueResult.status    === 'fulfilled' ? leagueResult.value    : null;
  const matches   = matchesResult.status   === 'fulfilled' ? matchesResult.value   : [];
  const standings = standingsResult.status === 'fulfilled' ? standingsResult.value : [];
  const scorers   = scorersResult.status   === 'fulfilled' ? scorersResult.value   : [];

  if (!league) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const live     = matches.filter(m => isLive(m.status));
  const finished = matches.filter(m => isFinished(m.status));
  const upcoming = matches.filter(m => !isLive(m.status) && !isFinished(m.status));

  const teamCrests: Record<string, string | null> = {};
  const teamNames:  Record<string, string> = {};
  for (const m of matches) {
    teamNames[m.homeTeamId]  = m.homeTeam.name;
    teamNames[m.awayTeamId]  = m.awayTeam.name;
    teamCrests[m.homeTeamId] = m.homeTeam.crestUrl;
    teamCrests[m.awayTeamId] = m.awayTeam.crestUrl;
  }
  for (const s of standings as any[]) {
    if (s.teamName)  teamNames[s.teamId]  = s.teamName;
    if (s.teamCrest) teamCrests[s.teamId] = s.teamCrest;
  }

  const tabs = [
    { id: 'fixtures',  label: 'Fixtures',  count: matches.length },
    { id: 'standings', label: 'Standings', count: standings.length },
    { id: 'scorers',   label: 'Scorers',   count: scorers.length },
  ];

  const flag = countryFlag(league.countryCode);

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>

      <nav className="breadcrumb">
        <a href="/">Today</a>
        <span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>{league.name}</span>
      </nav>

      <div className="match-hero" style={{ marginBottom: 20, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 40 }}>{flag}</span>
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
          {live.length > 0 && (
            <div style={{ marginLeft: 'auto' }}>
              <span className="status-badge live">
                <span className="live-dot" />{live.length} LIVE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {tabs.map(({ id, label, count }) => (
          <a key={id} href={`/leagues/${slug}?tab=${id}`} style={{
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.06em', padding: '10px 20px',
            color: tab === id ? 'var(--text)' : 'var(--text-dim)',
            borderBottom: tab === id ? '2px solid var(--green)' : '2px solid transparent',
            marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {label.toUpperCase()}
            {count > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: tab === id ? 'var(--green)' : 'var(--bg-elevated)',
                color: tab === id ? '#000' : 'var(--text-dim)',
                padding: '2px 6px', borderRadius: 999,
              }}>{count}</span>
            )}
          </a>
        ))}
      </div>

      {/* FIXTURES TAB */}
      {tab === 'fixtures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {matches.length === 0 ? (
            <EmptyState message="No fixtures available for this league." />
          ) : (
            <>
              {live.length > 0 && <MatchGroup label="Live Now" flag="🔴" count={live.length}>{live.map(m => <MatchRow key={m.id} match={m} />)}</MatchGroup>}
              {upcoming.length > 0 && <MatchGroup label="Upcoming" flag="🗓" count={upcoming.length}>{upcoming.map(m => <MatchRow key={m.id} match={m} />)}</MatchGroup>}
              {finished.length > 0 && <MatchGroup label="Results" flag="✓" count={finished.length}>{finished.map(m => <MatchRow key={m.id} match={m} />)}</MatchGroup>}
            </>
          )}
        </div>
      )}

      {/* STANDINGS TAB */}
      {tab === 'standings' && (
        <div>
          {standings.length === 0 ? (
            <EmptyState message="Standings not available yet." />
          ) : (
            <>
              <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
                <StandingsTable rows={standings} teamNames={teamNames} teamCrests={teamCrests} />
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
      )}

      {/* SCORERS TAB */}
      {tab === 'scorers' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {scorers.length === 0 ? (
            <EmptyState message="Top scorers data not available yet." />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--surface-2, rgba(255,255,255,0.03))' }}>
                  <th style={{ padding: '10px 12px', width: 40, textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>PLAYER</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>TEAM</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--green)', fontFamily: 'var(--font-display)' }}>G</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>A</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>MP</th>
                </tr>
              </thead>
              <tbody>
                {scorers.map((s: any, i: number) => (
                  <tr key={s.playerId} className="match-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px', textAlign: 'center', width: 40 }}>
                      {i === 0 ? <span style={{ fontSize: 16 }}>🥇</span>
                       : i === 1 ? <span style={{ fontSize: 16 }}>🥈</span>
                       : i === 2 ? <span style={{ fontSize: 16 }}>🥉</span>
                       : <span style={{ fontSize: 13, color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>{i + 1}</span>}
                    </td>
                    <td style={{ padding: '12px 12px 12px 0' }}>
                      <a href={`/players/${s.playerSlug}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}>
                        {s.playerName}
                      </a>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <a href={`/teams/${s.teamSlug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        <TeamCrest url={s.teamCrest} name={s.teamName} size={20} />
                        {s.teamName}
                      </a>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--green)', fontSize: 18, minWidth: 48 }}>{s.goals}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-muted)', minWidth: 48 }}>{s.assists}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-dim)', minWidth: 48 }}>{s.appearances}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
