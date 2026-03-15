'use client';

function MatchCard({ match, teamId }: { match: any; teamId: string }) {
  const isHome = match.home_team_id === teamId;
  const isFinished = match.status === 'FINISHED';
  const gs = isHome ? match.home_score : match.away_score;
  const ga = isHome ? match.away_score : match.home_score;
  const result = isFinished ? (gs > ga ? 'W' : gs < ga ? 'L' : 'D') : null;
  const resultColor = result === 'W' ? '#22c55e' : result === 'L' ? '#ef4444' : '#f59e0b';

  return (
    <a href={`/matches/${match.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#1e2235', borderRadius: 10, padding: '12px 16px',
        border: '1px solid #2a2d3a', display: 'flex', alignItems: 'center',
        gap: 12, marginBottom: 8, transition: 'border-color 0.2s',
      }}>
        {result && (
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: resultColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0,
          }}>{result}</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
            {match.league_name} • {new Date(match.kickoff_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={match.home_crest} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
            <span style={{ color: match.home_team_id === teamId ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: match.home_team_id === teamId ? 700 : 400 }}>
              {match.home_name}
            </span>
            {isFinished && (
              <span style={{ fontWeight: 800, color: '#fff', fontSize: 14, margin: '0 4px' }}>
                {match.home_score} - {match.away_score}
              </span>
            )}
            <img src={match.away_crest} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
            <span style={{ color: match.away_team_id === teamId ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: match.away_team_id === teamId ? 700 : 400 }}>
              {match.away_name}
            </span>
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

      {/* Recent Form */}
      <div style={{ background: '#1a1d27', borderRadius: 12, padding: 16, border: '1px solid #2a2d3a' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Recent Results
        </h3>
        {form.length === 0
          ? <p style={{ color: '#6b7280', fontSize: 13 }}>No recent matches</p>
          : form.map((m: any) => <MatchCard key={m.id} match={m} teamId={teamId} />)
        }
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Next Match */}
        {nextMatch && (
          <div style={{ background: '#1a1d27', borderRadius: 12, padding: 16, border: '1px solid #2a2d3a' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Next Match
            </h3>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
              {nextMatch.league_name} • {new Date(nextMatch.kickoff_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <a href={`/matches/${nextMatch.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                  <img src={nextMatch.home_crest} style={{ width: 40, height: 40, objectFit: 'contain' }} alt="" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{nextMatch.home_name}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#6b7280', padding: '0 8px' }}>VS</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                  <img src={nextMatch.away_crest} style={{ width: 40, height: 40, objectFit: 'contain' }} alt="" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{nextMatch.away_name}</span>
                </div>
              </div>
            </a>
          </div>
        )}

        {/* Top Scorers */}
        {topScorers.length > 0 && (
          <div style={{ background: '#1a1d27', borderRadius: 12, padding: 16, border: '1px solid #2a2d3a' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Top Scorers
            </h3>
            {topScorers.map((p: any, i: number) => (
              <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topScorers.length - 1 ? '1px solid #2a2d3a' : 'none' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{p.position} • {p.appearances ?? 0} apps</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#22c55e' }}>{p.goals}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>goals</div>
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
