'use client';

export default function TeamFixtures({ matches, teamId, type }: { matches: any[]; teamId: string; type: 'fixtures' | 'results' }) {
  if (!matches.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
      No {type === 'fixtures' ? 'upcoming fixtures' : 'results'} found.
    </div>
  );

  // Group by month
  const grouped = matches.reduce((acc: any, m: any) => {
    const d = new Date(m.kickoff_at);
    const key = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(grouped).map(([month, ms]: any) => (
        <div key={month} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 0', marginBottom: 8, borderBottom: '1px solid #2a2d3a' }}>
            {month}
          </div>
          {ms.map((m: any) => {
            const isHome = m.home_team_id === teamId;
            const isFinished = m.status === 'FINISHED';
            const gs = isHome ? m.home_score : m.away_score;
            const ga = isHome ? m.away_score : m.home_score;
            const result = isFinished ? (gs > ga ? 'W' : gs < ga ? 'L' : 'D') : null;
            const rc = result === 'W' ? '#22c55e' : result === 'L' ? '#ef4444' : '#f59e0b';
            const d = new Date(m.kickoff_at);

            return (
              <a key={m.id} href={`/matches/${m.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', background: '#1a1d27',
                  borderRadius: 10, marginBottom: 6, border: '1px solid #2a2d3a',
                }}>
                  {/* Date */}
                  <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{d.getDate()}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{d.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                  </div>

                  {/* League */}
                  <div style={{ width: 80, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.league_name}</div>
                    {m.round && <div style={{ fontSize: 10, color: '#4b5563' }}>{m.round}</div>}
                  </div>

                  {/* Teams + score */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={m.home_crest} style={{ width: 22, height: 22, objectFit: 'contain' }} alt="" />
                    <span style={{ fontSize: 13, fontWeight: m.home_team_id === teamId ? 700 : 400, color: m.home_team_id === teamId ? '#fff' : '#9ca3af' }}>{m.home_name}</span>
                    <span style={{ fontWeight: 800, color: '#fff', fontSize: 14, margin: '0 6px', minWidth: 40, textAlign: 'center' }}>
                      {isFinished ? `${m.home_score} - ${m.away_score}` : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <img src={m.away_crest} style={{ width: 22, height: 22, objectFit: 'contain' }} alt="" />
                    <span style={{ fontSize: 13, fontWeight: m.away_team_id === teamId ? 700 : 400, color: m.away_team_id === teamId ? '#fff' : '#9ca3af' }}>{m.away_name}</span>
                  </div>

                  {/* Result badge */}
                  {result && (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: rc, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {result}
                    </div>
                  )}

                  {/* H/A */}
                  <div style={{ fontSize: 11, color: '#4b5563', width: 16, textAlign: 'center', flexShrink: 0 }}>
                    {isHome ? 'H' : 'A'}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ))}
    </div>
  );
}
