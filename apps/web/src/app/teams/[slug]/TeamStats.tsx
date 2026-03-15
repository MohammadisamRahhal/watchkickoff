'use client';
import { useState } from 'react';

function seasonLabel(s: string): string {
  const y = parseInt(s);
  return `${y}/${String(y + 1).slice(2)}`;
}

function seasonShort(s: string): string {
  const y = parseInt(s);
  return `${String(y).slice(2)}/${String(y + 1).slice(2)}`;
}

const ALL_SEASONS = ['2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015'];

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{value}</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

interface Props { stats: any; teamSlug?: string; overview?: any }

export default function TeamStats({ stats, teamSlug, overview }: Props) {
  const [season, setSeason] = useState('2025');
  const [data, setData] = useState<any>(stats);
  const [loading, setLoading] = useState(false);
  const [playerTab, setPlayerTab] = useState<'scorers' | 'assists' | 'combined'>('scorers');

  async function loadSeason(s: string) {
    if (s === season) return;
    setSeason(s);
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
  const wins   = Number(d?.wins ?? 0);
  const draws  = Number(d?.draws ?? 0);
  const losses = Number(d?.losses ?? 0);
  const gf     = Number(d?.goals_for ?? 0);
  const ga     = Number(d?.goals_against ?? 0);
  const cs     = Number(d?.clean_sheets ?? 0);
  const hp     = Number(d?.home_played ?? 0);
  const hw     = Number(d?.home_wins ?? 0);
  const ap     = Number(d?.away_played ?? 0);
  const aw     = Number(d?.away_wins ?? 0);
  const wr     = played > 0 ? Math.round((wins / played) * 100) : 0;

  // Top scorers from overview
  const topScorers: any[] = overview?.topScorers ?? [];
  const topAssists = [...topScorers].sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0)).filter(p => p.assists > 0);
  const topCombined = [...topScorers].sort((a, b) => ((b.goals ?? 0) + (b.assists ?? 0)) - ((a.goals ?? 0) + (a.assists ?? 0)));

  const playerList = playerTab === 'scorers' ? topScorers : playerTab === 'assists' ? topAssists : topCombined;

  return (
    <div>
      {/* Season pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {ALL_SEASONS.map(s => (
          <button key={s} onClick={() => loadSeason(s)} style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)',
            background: season === s ? 'var(--blue)' : 'var(--bg-card)',
            color: season === s ? '#fff' : 'var(--text-muted)',
            fontWeight: season === s ? 700 : 400, fontSize: 12,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font-body)',
          }}>{seasonShort(s)}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : !d || played === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No data for {seasonLabel(season)}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Top row: Season stats + Goals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Season card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Season {seasonLabel(season)}
                </h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', background: 'rgba(29,78,216,0.08)', padding: '2px 10px', borderRadius: 20 }}>{played} matches</span>
              </div>
              <StatBar label="Wins"         value={wins}   max={played} color="#22c55e" />
              <StatBar label="Draws"        value={draws}  max={played} color="#f59e0b" />
              <StatBar label="Losses"       value={losses} max={played} color="#ef4444" />
              <StatBar label="Clean Sheets" value={cs}     max={played} color="var(--blue)" />
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Win Rate</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#22c55e' }}>{wr}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${wr}%`, background: '#22c55e', borderRadius: 3 }} />
                </div>
              </div>
            </div>

            {/* Goals card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, border: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goals</h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                {[
                  { l: 'Scored',    v: gf,           c: '#22c55e' },
                  { l: 'Conceded',  v: ga,           c: '#ef4444' },
                  { l: 'GD',        v: `${gf - ga >= 0 ? '+' : ''}${gf - ga}`, c: 'var(--blue)' },
                ].map(s => (
                  <div key={s.l} style={{ flex: 1, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Per game: <strong style={{ color: 'var(--text)' }}>{played > 0 ? (gf / played).toFixed(1) : '0.0'}</strong> scored &nbsp;/&nbsp;
                <strong style={{ color: 'var(--text)' }}>{played > 0 ? (ga / played).toFixed(1) : '0.0'}</strong> conceded
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { l: 'Home P', v: hp }, { l: 'Home W', v: hw },
                  { l: 'Away P', v: ap }, { l: 'Away W', v: aw },
                ].map(s => (
                  <div key={s.l} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top stats section — zي FotMob */}
          {topScorers.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Top Stats</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([
                    { id: 'scorers',  label: 'Top scorer' },
                    { id: 'assists',  label: 'Assists' },
                    { id: 'combined', label: 'Goals + Assists' },
                  ] as { id: typeof playerTab; label: string }[]).map(t => (
                    <button key={t.id} onClick={() => setPlayerTab(t.id)} style={{
                      padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)',
                      background: playerTab === t.id ? 'var(--text)' : 'transparent',
                      color: playerTab === t.id ? 'var(--bg-card)' : 'var(--text-muted)',
                      fontWeight: playerTab === t.id ? 700 : 400, fontSize: 12,
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}>{t.label}</button>
                  ))}
                </div>
              </div>

              {/* Player rows */}
              {playerList.length === 0 ? (
                <div style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: 13 }}>No data available</div>
              ) : playerList.map((p: any, i: number) => {
                const value = playerTab === 'scorers' ? p.goals : playerTab === 'assists' ? p.assists : (p.goals ?? 0) + (p.assists ?? 0);
                return (
                  <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                      background: i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)',
                    }}>
                      {/* Rank */}
                      <div style={{ width: 20, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>

                      {/* Avatar */}
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', flexShrink: 0, overflow: 'hidden' }}>
                        {p.name.split(' ').map((n: string) => n[0] ?? '').join('').substring(0, 2).toUpperCase()}
                      </div>

                      {/* Name + position */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.position} · {p.appearances ?? 0} apps</div>
                      </div>

                      {/* Value badge */}
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                        {value ?? 0}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
