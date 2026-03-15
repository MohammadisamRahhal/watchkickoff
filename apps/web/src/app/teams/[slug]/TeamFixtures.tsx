'use client';

export default function TeamFixtures({ matches, teamId, type }: { matches: any[]; teamId: string; type: 'fixtures' | 'results' }) {
  if (!matches.length) return <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>No {type === 'fixtures' ? 'upcoming fixtures' : 'results'} found.</div>;

  const grouped = matches.reduce((acc: any, m: any) => {
    const key = new Date(m.kickoff_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(grouped).map(([month, ms]: any) => (
        <div key={month} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 0', marginBottom: 8, borderBottom: '1px solid var(--border)' }}>{month}</div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, marginBottom: 4, border: '1px solid var(--border)' }}>
                  <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{d.getDate()}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                  </div>
                  <div style={{ width: 90, flexShrink: 0, fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.league_name}</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src={m.home_crest} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
                    <span style={{ fontSize: 13, fontWeight: m.home_team_id === teamId ? 700 : 400, color: 'var(--text)' }}>{m.home_name}</span>
                    <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: 13, margin: '0 4px', minWidth: 44, textAlign: 'center' }}>
                      {isFinished ? `${m.home_score} - ${m.away_score}` : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <img src={m.away_crest} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
                    <span style={{ fontSize: 13, fontWeight: m.away_team_id === teamId ? 700 : 400, color: 'var(--text)' }}>{m.away_name}</span>
                  </div>
                  {result && <div style={{ width: 24, height: 24, borderRadius: '50%', background: rc, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{result}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', width: 14, textAlign: 'center', flexShrink: 0 }}>{isHome ? 'H' : 'A'}</div>
                </div>
              </a>
            );
          })}
        </div>
      ))}
    </div>
  );
}
