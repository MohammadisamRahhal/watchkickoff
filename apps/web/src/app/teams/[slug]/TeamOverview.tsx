'use client';

function MatchCard({ match, teamId }: { match: any; teamId: string }) {
  const isHome = match.home_team_id === teamId;
  const isFinished = match.status === 'FINISHED';
  const gs = isHome ? match.home_score : match.away_score;
  const ga = isHome ? match.away_score : match.home_score;
  const result = isFinished ? (gs > ga ? 'W' : gs < ga ? 'L' : 'D') : null;
  const rc = result === 'W' ? '#22c55e' : result === 'L' ? '#ef4444' : '#f59e0b';
  return (
    <a href={`/matches/${match.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        {result && <div style={{ width: 24, height: 24, borderRadius: '50%', background: rc, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{result}</div>}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{match.league_name} • {new Date(match.kickoff_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src={match.home_crest} style={{ width: 18, height: 18, objectFit: 'contain' }} alt="" />
            <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: match.home_team_id === teamId ? 700 : 400 }}>{match.home_name}</span>
            {isFinished && <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: 13, margin: '0 4px' }}>{match.home_score} - {match.away_score}</span>}
            <img src={match.away_crest} style={{ width: 18, height: 18, objectFit: 'contain' }} alt="" />
            <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: match.away_team_id === teamId ? 700 : 400 }}>{match.away_name}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function TeamOverview({ overview, teamId }: { overview: any; teamId: string }) {
  const { form = [], nextMatch, topScorers = [] } = overview ?? {};
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Results</h3>
        {form.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No recent matches</p> : form.map((m: any) => <MatchCard key={m.id} match={m} teamId={teamId} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {nextMatch && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Match</h3>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{nextMatch.league_name} • {new Date(nextMatch.kickoff_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            <a href={`/matches/${nextMatch.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                  <img src={nextMatch.home_crest} style={{ width: 40, height: 40, objectFit: 'contain' }} alt="" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textAlign: 'center' }}>{nextMatch.home_name}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-muted)', padding: '0 8px' }}>VS</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                  <img src={nextMatch.away_crest} style={{ width: 40, height: 40, objectFit: 'contain' }} alt="" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textAlign: 'center' }}>{nextMatch.away_name}</span>
                </div>
              </div>
            </a>
          </div>
        )}
        {topScorers.length > 0 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Scorers</h3>
            {topScorers.map((p: any, i: number) => (
              <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topScorers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.position} • {p.appearances ?? 0} apps</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#22c55e' }}>{p.goals}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>goals</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
