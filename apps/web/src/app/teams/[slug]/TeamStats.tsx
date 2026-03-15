'use client';
import { useState, useEffect } from 'react';

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

function seasonLabel(s: string): string {
  const y = parseInt(s);
  return `${String(y).slice(2)}/${String(y+1).slice(2)}`;
}

// All seasons we have data for
const ALL_SEASONS = ['2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015'];

export default function TeamStats({ stats, teamSlug }: { stats: any; teamSlug?: string }) {
  const [season, setSeason] = useState('2025');
  const [data, setData] = useState<any>(stats);
  const [loading, setLoading] = useState(false);
  const [availableSeasons, setAvailableSeasons] = useState<string[]>(['2025']);

  useEffect(() => {
    // Find which seasons have data by checking matches count
    if (teamSlug) {
      fetch(`/api/v1/teams/${teamSlug}/seasons`)
        .then(r => r.json())
        .then(j => { if (j.data?.length) setAvailableSeasons(j.data); })
        .catch(() => setAvailableSeasons(ALL_SEASONS));
    }
  }, [teamSlug]);

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

  return (
    <div>
      {/* Season tabs - scrollable */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {ALL_SEASONS.map(s => (
          <button key={s} onClick={() => loadSeason(s)} style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)',
            background: season === s ? 'var(--blue)' : 'var(--bg-card)',
            color: season === s ? '#fff' : 'var(--text-muted)',
            fontWeight: season === s ? 700 : 400, fontSize: 13, cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>{seasonLabel(s)}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : !d || played === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No data for {seasonLabel(season)}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Season {seasonLabel(season)}</h3>
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
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{l:'Home Played',v:hp},{l:'Home Wins',v:hw},{l:'Away Played',v:ap},{l:'Away Wins',v:aw}].map(s=>(
                <div key={s.l} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
