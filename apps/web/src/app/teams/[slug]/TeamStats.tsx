'use client';
import { useState } from 'react';

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

const SEASONS = [
  { key: '2025', label: '25/26' },
  { key: '2024', label: '24/25' },
  { key: '2023', label: '23/24' },
  { key: '2022', label: '22/23' },
  { key: '2021', label: '21/22' },
];

export default function TeamStats({ stats, teamSlug }: { stats: any; teamSlug?: string }) {
  const [season, setSeason] = useState('2025');
  const [data, setData] = useState<any>(stats);
  const [loading, setLoading] = useState(false);

  async function loadSeason(s: string) {
    if (s === season) return;
    setSeason(s);
    if (s === '2025') { setData(stats); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/teams/${teamSlug}/stats?season=${s}`);
      const json = await res.json();
      setData(json.data);
    } catch { setData(null); }
    setLoading(false);
  }

  const d = data;
  const played = Number(d?.played ?? 0);
  const wins = Number(d?.wins ?? 0);
  const draws = Number(d?.draws ?? 0);
  const losses = Number(d?.losses ?? 0);
  const gf = Number(d?.goals_for ?? 0);
  const ga = Number(d?.goals_against ?? 0);
  const cs = Number(d?.clean_sheets ?? 0);
  const hp = Number(d?.home_played ?? 0);
  const hw = Number(d?.home_wins ?? 0);
  const ap = Number(d?.away_played ?? 0);
  const aw = Number(d?.away_wins ?? 0);
  const wr = played > 0 ? Math.round((wins / played) * 100) : 0;
  const sl = SEASONS.find(s => s.key === season)?.label ?? season;

  return (
    <div>
      {/* Season tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {SEASONS.map(s => (
          <button key={s.key} onClick={() => loadSeason(s.key)} style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)',
            background: season === s.key ? 'var(--blue)' : 'var(--bg-card)',
            color: season === s.key ? '#fff' : 'var(--text-muted)',
            fontWeight: season === s.key ? 700 : 400, fontSize: 13, cursor: 'pointer',
          }}>{s.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : !d || played === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No data for {sl}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Season {sl}</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'rgba(29,78,216,0.08)', padding: '2px 10px', borderRadius: 20 }}>{played} matches</span>
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
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Per game: <strong style={{ color: 'var(--text)' }}>{played > 0 ? (gf/played).toFixed(1) : '0.0'}</strong> scored / <strong style={{ color: 'var(--text)' }}>{played > 0 ? (ga/played).toFixed(1) : '0.0'}</strong> conceded</div>
          </div>

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
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>Win rate: <strong style={{ color: '#22c55e' }}>{p > 0 ? Math.round((w/p)*100) : 0}%</strong></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
