'use client';

function MatchRow({ match, teamId }: { match: any; teamId: string }) {
  const isHome     = match.home_team_id === teamId;
  const isFinished = match.status === 'FINISHED';
  const gs = isHome ? Number(match.home_score) : Number(match.away_score);
  const ga = isHome ? Number(match.away_score) : Number(match.home_score);
  const result = isFinished ? (gs > ga ? 'W' : gs < ga ? 'L' : 'D') : null;
  const rc = result === 'W' ? '#22c55e' : result === 'L' ? '#ef4444' : '#f59e0b';
  return (
    <a href={`/matches/${match.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, marginBottom: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: result ? rc : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 9, flexShrink: 0 }}>{result ?? '•'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
            {match.league_name} · {new Date(match.kickoff_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            {match.home_crest && <img src={match.home_crest} style={{ width: 16, height: 16, objectFit: 'contain' }} alt="" onError={(e: any) => e.target.style.display = 'none'} />}
            <span style={{ fontWeight: match.home_team_id === teamId ? 700 : 400, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{match.home_name}</span>
            {isFinished && <span style={{ fontWeight: 800, color: 'var(--text)', margin: '0 2px', flexShrink: 0 }}>{match.home_score}–{match.away_score}</span>}
            {match.away_crest && <img src={match.away_crest} style={{ width: 16, height: 16, objectFit: 'contain' }} alt="" onError={(e: any) => e.target.style.display = 'none'} />}
            <span style={{ fontWeight: match.away_team_id === teamId ? 700 : 400, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{match.away_name}</span>
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: isHome ? 'var(--blue)' : 'var(--text-dim)', flexShrink: 0 }}>{isHome ? 'H' : 'A'}</div>
      </div>
    </a>
  );
}

export default function TeamOverview({ overview, teamId }: { overview: any; teamId: string }) {
  const { form = [], nextMatch, topScorers = [], stats } = overview ?? {};
  const played  = Number(stats?.played ?? 0);
  const wins    = Number(stats?.wins ?? 0);
  const draws   = Number(stats?.draws ?? 0);
  const losses  = Number(stats?.losses ?? 0);
  const gf      = Number(stats?.goals_for ?? 0);
  const ga      = Number(stats?.goals_against ?? 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {played > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
          {[
            { label: 'Played',        value: played, color: 'var(--text)' },
            { label: 'Wins',          value: wins,   color: '#22c55e' },
            { label: 'Draws',         value: draws,  color: '#f59e0b' },
            { label: 'Losses',        value: losses, color: '#ef4444' },
            { label: 'Goals For',     value: gf,     color: 'var(--blue)' },
            { label: 'Goals Against', value: ga,     color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '12px 8px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Results</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>25/26</span>
          </div>
          {form.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No recent matches</p>
            : form.map((m: any) => <MatchRow key={m.id} match={m} teamId={teamId} />)
          }
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {nextMatch && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next Match</h3>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>
                {nextMatch.league_name} · {new Date(nextMatch.kickoff_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
              <a href={`/matches/${nextMatch.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    {nextMatch.home_crest && <img src={nextMatch.home_crest} style={{ width: 44, height: 44, objectFit: 'contain' }} alt="" onError={(e: any) => e.target.style.display = 'none'} />}
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>{nextMatch.home_name}</span>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0 6px' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-muted)' }}>VS</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(nextMatch.kickoff_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    {nextMatch.away_crest && <img src={nextMatch.away_crest} style={{ width: 44, height: 44, objectFit: 'contain' }} alt="" onError={(e: any) => e.target.style.display = 'none'} />}
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>{nextMatch.away_name}</span>
                  </div>
                </div>
              </a>
            </div>
          )}

          {topScorers.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Scorers</h3>
              {topScorers.map((p: any, i: number) => (
                <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topScorers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? '#f59e0b' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: i === 0 ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border)', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.position} · {p.appearances ?? 0} apps</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#22c55e' }}>{p.goals}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>goals</div>
                    </div>
                    {p.assists > 0 && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{p.assists}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>ast</div>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
