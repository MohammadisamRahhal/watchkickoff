'use client';

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{value}</span>
      </div>
      <div style={{ height: 6, background: '#2a2d3a', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

export default function TeamStats({ stats }: { stats: any }) {
  if (!stats) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>No stats available.</div>
  );

  const played = Number(stats.played ?? 0);
  const wins = Number(stats.wins ?? 0);
  const draws = Number(stats.draws ?? 0);
  const losses = Number(stats.losses ?? 0);
  const gf = Number(stats.goals_for ?? 0);
  const ga = Number(stats.goals_against ?? 0);
  const cs = Number(stats.clean_sheets ?? 0);
  const homePlayed = Number(stats.home_played ?? 0);
  const homeWins = Number(stats.home_wins ?? 0);
  const awayPlayed = Number(stats.away_played ?? 0);
  const awayWins = Number(stats.away_wins ?? 0);
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

      {/* Season Summary */}
      <div style={{ background: '#1a1d27', borderRadius: 12, padding: 20, border: '1px solid #2a2d3a' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Season 2025/26
        </h3>
        <StatBar label="Wins" value={wins} max={played} color="#22c55e" />
        <StatBar label="Draws" value={draws} max={played} color="#f59e0b" />
        <StatBar label="Losses" value={losses} max={played} color="#ef4444" />
        <StatBar label="Clean Sheets" value={cs} max={played} color="#3b82f6" />
      </div>

      {/* Goals */}
      <div style={{ background: '#1a1d27', borderRadius: 12, padding: 20, border: '1px solid #2a2d3a' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Goals
        </h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, textAlign: 'center', background: '#252a3d', borderRadius: 10, padding: '16px 8px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#22c55e' }}>{gf}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Scored</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', background: '#252a3d', borderRadius: 10, padding: '16px 8px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>{ga}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Conceded</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', background: '#252a3d', borderRadius: 10, padding: '16px 8px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#3b82f6' }}>{gf - ga >= 0 ? '+' : ''}{gf - ga}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>GD</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Avg scored: <strong style={{ color: '#fff' }}>{played > 0 ? (gf / played).toFixed(1) : '0.0'}</strong> per game
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Avg conceded: <strong style={{ color: '#fff' }}>{played > 0 ? (ga / played).toFixed(1) : '0.0'}</strong> per game
        </div>
      </div>

      {/* Home vs Away */}
      <div style={{ background: '#1a1d27', borderRadius: 12, padding: 20, border: '1px solid #2a2d3a', gridColumn: 'span 2' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Home vs Away
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: '🏠 Home', played: homePlayed, wins: homeWins },
            { label: '✈️ Away', played: awayPlayed, wins: awayWins },
          ].map(({ label, played: p, wins: w }) => (
            <div key={label} style={{ background: '#252a3d', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>{label}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{w}</div><div style={{ fontSize: 11, color: '#6b7280' }}>W</div></div>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{p - w > 0 ? p - w : 0}</div><div style={{ fontSize: 11, color: '#6b7280' }}>D+L</div></div>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{p}</div><div style={{ fontSize: 11, color: '#6b7280' }}>GP</div></div>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
                Win rate: <strong style={{ color: p > 0 ? '#22c55e' : '#fff' }}>{p > 0 ? Math.round((w / p) * 100) : 0}%</strong>
              </div>
            </div>
          ))}
        </div>

        {/* Overall win rate bar */}
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#252a3d', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>Overall Win Rate</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#22c55e' }}>{winRate}%</span>
          </div>
          <div style={{ height: 8, background: '#2a2d3a', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${winRate}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: 4 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
