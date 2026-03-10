import { notFound } from 'next/navigation';
import { getTeamBySlug, getTeamMatches, getTeamStandings, getTeamSquad } from '@/lib/api';


function MatchRow({ match }: { match: any }) {
  const date = new Date(match.kickoffAt);
  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';
  return (
    <a href={`/matches/${match.slug}`} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      background: 'var(--surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 8, marginBottom: 6, textDecoration: 'none',
    }} className="match-row">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {match.homeTeam?.crestUrl && <img src={match.homeTeam?.crestUrl} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />}
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{match.homeTeam?.name}</span>
      </div>
      <div style={{ textAlign: 'center', minWidth: 80 }}>
        {isFinished || isLive ? (
          <span style={{ fontSize: 16, fontWeight: 800, color: isLive ? 'var(--live)' : 'var(--text)' }}>
            {match.homeScore} – {match.awayScore}
          </span>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {isLive && <div style={{ fontSize: 10, color: 'var(--live)', fontWeight: 700 }}>LIVE</div>}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        {match.awayTeam?.crestUrl && <img src={match.awayTeam?.crestUrl} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />}
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{match.awayTeam?.name}</span>
      </div>
    </a>
  );
}

export default async function TeamPage({ params, searchParams }: any) {
  const { slug } = await params;
  const { tab = 'fixtures' } = await searchParams;

  const team = await getTeamBySlug(slug).catch(() => null);
  if (!team) notFound();

  const [matchesRes, standingsRes, squadRes] = await Promise.allSettled([
    getTeamMatches(slug),
    getTeamStandings(slug),
    getTeamSquad(slug),
  ]);

  const matches  = matchesRes.status  === 'fulfilled' ? matchesRes.value  : [];
  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value : [];
  const squad    = squadRes.status    === 'fulfilled' ? squadRes.value    : [];

  const tabs = [
    { id: 'fixtures',  label: 'Fixtures',  count: matches.length },
    { id: 'standings', label: 'Standings', count: standings.length },
    { id: 'squad',     label: 'Squad',     count: squad.length },
  ];

  const finished = matches.filter((m: any) => m.status === 'FINISHED');
  const upcoming = matches.filter((m: any) => m.status === 'SCHEDULED' || m.status === 'POSTPONED');
  const live     = matches.filter((m: any) => m.status === 'LIVE');

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', gap: 8 }}>
        <a href="/" style={{ color: 'var(--text-muted)' }}>Today</a>
        <span>›</span>
        <span>{team.name}</span>
      </nav>

      {/* Team Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        {team.crestUrl ? (
          <img src={team.crestUrl} alt={team.name} style={{ width: 72, height: 72, objectFit: 'contain' }} />
        ) : (
          <div style={{ width: 72, height: 72, background: 'var(--border-subtle)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--text-muted)' }}>
            {team.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{team.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
            <span>{team.countryCode}</span>
            {matches.length > 0 && <span>· {matches.length} matches</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-subtle)', marginBottom: 24 }}>
        {tabs.map(t => (
          <a key={t.id} href={`?tab=${t.id}`} style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t.label.toUpperCase()}
            {t.count > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--border-subtle)', borderRadius: 10, padding: '1px 6px' }}>{t.count}</span>}
          </a>
        ))}
      </div>

      {/* Fixtures Tab */}
      {tab === 'fixtures' && (
        <div>
          {matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No fixtures available.</div>
          ) : (
            <>
              {live.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--live)', marginBottom: 8, letterSpacing: 1 }}>🔴 LIVE</div>
                  {live.map((m: any) => <MatchRow key={m.id} match={m} />)}
                </div>
              )}
              {upcoming.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 1 }}>UPCOMING</div>
                  {upcoming.slice(0, 10).map((m: any) => <MatchRow key={m.id} match={m} />)}
                </div>
              )}
              {finished.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 1 }}>RESULTS</div>
                  {finished.slice(0, 20).map((m: any) => <MatchRow key={m.id} match={m} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Standings Tab */}
      {tab === 'standings' && (
        <div>
          {standings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No standings available.</div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-alt)', color: 'var(--text-muted)', fontSize: 11 }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left' }}>League</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>P</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>W</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>D</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>L</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>GD</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {(standings as any[]).map((row: any, i: number) => (
                    <tr key={row.teamId} style={{ borderTop: '1px solid var(--border-subtle)', background: row.teamSlug === slug ? 'rgba(0,200,100,0.08)' : 'transparent' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{row.position}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <a href={`/leagues/${row.league_slug}`} style={{ color: 'var(--text)', fontWeight: 500, textDecoration: 'none' }}>{row.league_name}</a>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.played}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.wins}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.draws}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.losses}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: row.goal_diff > 0 ? 'var(--accent)' : row.goal_diff < 0 ? '#ef4444' : 'var(--text-muted)' }}>{row.goal_diff > 0 ? '+' : ''}{row.goal_diff}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--text)' }}>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Squad Tab */}
      {tab === 'squad' && (
        <div>
          {squad.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Squad not available yet.</div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-alt)', color: 'var(--text-muted)', fontSize: 11 }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left' }}>Player</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Pos</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Nat</th>
                  </tr>
                </thead>
                <tbody>
                  {(squad as any[]).map((p: any) => (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <a href={`/players/${p.slug}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>{p.name}</a>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{p.position ?? '—'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{p.nationality_code ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
