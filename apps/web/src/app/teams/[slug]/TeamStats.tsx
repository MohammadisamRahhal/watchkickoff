'use client';

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{value}</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

const SEASON_LABELS: Record<string, string> = {
  '2025': '25/26', '2024': '24/25', '2023': '23/24',
  '2022': '22/23', '2021': '21/22', '2020': '20/21',
};

export default function TeamStats({ stats }: { stats: any }) {
  if (!stats) return <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>No stats available.</div>;

  const played = Number(stats.played ?? 0);
  const wins = Number(stats.wins ?? 0);
  const draws = Number(stats.draws ?? 0);
  const losses = Number(stats.losses ?? 0);
  const gf = Number(stats.goals_for ?? 0);
  const ga = Number(stats.goals_against ?? 0);
  const cs = Number(stats.clean_sheets ?? 0);
  const hp = Number(stats.home_played ?? 0);
  const hw = Number(stats.home_wins ?? 0);
  const ap = Number(stats.away_played ?? 0);
  const aw = Number(stats.away_wins ?? 0);
  const wr = played > 0 ? Math.round((wins / played) * 100) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

      {/* Season summary */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Season</h3>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'rgba(29,78,216,0.08)', padding: '2px 10px', borderRadius: 20 }}>25/26</span>
        </div>
        <StatBar label="Wins" value={wins} max={played} color="#22c55e" />
        <StatBar label="Draws" value={draws} max={played} color="#f59e0b" />
        <StatBar label="Losses" value={losses} max={played} color="#ef4444" />
        <StatBar label="Clean Sheets" value={cs} max={played} color="var(--blue)" />
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Win Rate</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#22c55e' }}>{wr}%</span>
          </div>
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${wr}%`, background: '#22c55e', borderRadius: 3 }} />
          </div>
        </div>
      </div>

      {/* Goals */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goals</h3>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[{l:'Scored',v:gf,c:'#22c55e'},{l:'Conceded',v:ga,c:'#ef4444'},{l:'GD',v:`${gf-ga>=0?'+':''}${gf-ga}`,c:'var(--blue)'}].map(s => (
            <div key={s.l} style={{ flex: 1, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
          Per game: <strong style={{ color: 'var(--text)' }}>{played > 0 ? (gf/played).toFixed(1) : '0.0'}</strong> scored / <strong style={{ color: 'var(--text)' }}>{played > 0 ? (ga/played).toFixed(1) : '0.0'}</strong> conceded
        </div>
      </div>

      {/* Home vs Away */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, border: '1px solid var(--border)', gridColumn: 'span 2' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Home vs Away</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[{label:'🏠 Home',p:hp,w:hw},{label:'✈️ Away',p:ap,w:aw}].map(({label,p,w}) => (
            <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 14, textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{label}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <div><div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{w}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>W</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{p-w>0?p-w:0}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>D+L</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{p}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>GP</div></div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                Win rate: <strong style={{ color: '#22c55e' }}>{p > 0 ? Math.round((w/p)*100) : 0}%</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matches summary */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, border: '1px solid var(--border)', gridColumn: 'span 2' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Season 25/26 Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {[
            { label: 'Played', value: played, color: 'var(--text)' },
            { label: 'Won', value: wins, color: '#22c55e' },
            { label: 'Drawn', value: draws, color: '#f59e0b' },
            { label: 'Lost', value: losses, color: '#ef4444' },
            { label: 'Goals For', value: gf, color: 'var(--blue)' },
            { label: 'Goals Ag.', value: ga, color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
