'use client';
import { useState } from 'react';

function seasonLabel(s: string) {
  const y = parseInt(s);
  return `${y}/${String(y + 1).slice(2)}`;
}
function seasonShort(s: string) {
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
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

interface Props { stats: any; teamSlug?: string; overview?: any; standings?: any }

export default function TeamStats({ stats, teamSlug, overview, standings }: Props) {
  const [season, setSeason] = useState('2025');
  const [data, setData]     = useState<any>(stats);
  const [loading, setLoading] = useState(false);
  const [playerTab, setPlayerTab] = useState<'scorers'|'assists'|'combined'>('scorers');

  // League info from standings
  const leagueName = standings?.league?.name ?? '';
  const leagueSlug = standings?.league?.slug ?? '';

  async function loadSeason(s: string) {
    if (s === season) return;
    setSeason(s);
    setLoading(true);
    try {
      const res  = await fetch(`/api/v1/teams/${teamSlug}/stats?season=${s}`);
      const json = await res.json();
      setData(json.data);
    } catch { setData(null); }
    setLoading(false);
  }

  const d      = data;
  const played = Number(d?.played ?? 0);
  const wins   = Number(d?.wins   ?? 0);
  const draws  = Number(d?.draws  ?? 0);
  const losses = Number(d?.losses ?? 0);
  const gf     = Number(d?.goals_for      ?? 0);
  const ga     = Number(d?.goals_against  ?? 0);
  const cs     = Number(d?.clean_sheets   ?? 0);
  const hp     = Number(d?.home_played    ?? 0);
  const hw     = Number(d?.home_wins      ?? 0);
  const ap     = Number(d?.away_played    ?? 0);
  const aw     = Number(d?.away_wins      ?? 0);
  const wr     = played > 0 ? Math.round((wins / played) * 100) : 0;

  const topScorers: any[] = overview?.topScorers ?? [];
  const topAssists  = [...topScorers].sort((a,b) => (b.assists??0)-(a.assists??0)).filter(p=>p.assists>0);
  const topCombined = [...topScorers].sort((a,b)=>((b.goals??0)+(b.assists??0))-((a.goals??0)+(a.assists??0)));
  const playerList  = playerTab==='scorers' ? topScorers : playerTab==='assists' ? topAssists : topCombined;

  return (
    <div>
      {/* League + Season header — زي FotMob */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
        {/* League name */}
        {leagueName && (
          <a href={leagueSlug ? `/leagues/${leagueSlug}` : '#'}
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              {leagueName} {seasonShort(season)}
            </span>
          </a>
        )}

        {/* Season dropdown */}
        <select
          value={season}
          onChange={e => loadSeason(e.target.value)}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}
        >
          {ALL_SEASONS.map(s => <option key={s} value={s}>{seasonShort(s)}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : !d || played === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No data for {seasonLabel(season)}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Season stats + Goals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Season {seasonShort(season)}</h3>
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

            <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, border: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goals</h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                {[
                  { l:'Scored',   v: gf,                                         c:'#22c55e' },
                  { l:'Conceded', v: ga,                                         c:'#ef4444' },
                  { l:'GD',       v:`${gf-ga>=0?'+':''}${gf-ga}`,               c:'var(--blue)' },
                ].map(s => (
                  <div key={s.l} style={{ flex:1, textAlign:'center', background:'var(--bg-elevated)', borderRadius:8, padding:'12px 6px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:24, fontWeight:900, color:s.c, lineHeight:1 }}>{s.v}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
                Per game: <strong style={{ color:'var(--text)' }}>{played>0?(gf/played).toFixed(1):'0.0'}</strong> scored &nbsp;/&nbsp;
                <strong style={{ color:'var(--text)' }}>{played>0?(ga/played).toFixed(1):'0.0'}</strong> conceded
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[{l:'Home P',v:hp},{l:'Home W',v:hw},{l:'Away P',v:ap},{l:'Away W',v:aw}].map(s=>(
                  <div key={s.l} style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'8px 10px', border:'1px solid var(--border)', textAlign:'center' }}>
                    <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{s.v}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Stats — زي FotMob بالضبط */}
          {topScorers.length > 0 && (
            <div style={{ background:'var(--bg-card)', borderRadius:10, border:'1px solid var(--border)', overflow:'hidden' }}>
              <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                <h3 style={{ margin:'0 0 10px', fontSize:14, fontWeight:700, color:'var(--text)' }}>Top stats</h3>
                {/* Players / Teams toggle */}
                <div style={{ display:'flex', gap:0, background:'var(--bg-elevated)', borderRadius:8, padding:2, width:'fit-content', border:'1px solid var(--border)' }}>
                  {(['scorers','assists','combined'] as const).map((t,i) => {
                    const labels = ['Top scorer','Assists','Goals + Assists'];
                    return (
                      <button key={t} onClick={() => setPlayerTab(t)} style={{
                        padding:'5px 16px', borderRadius:6, border:'none',
                        background: playerTab===t ? 'var(--bg-card)' : 'transparent',
                        color: playerTab===t ? 'var(--text)' : 'var(--text-muted)',
                        fontWeight: playerTab===t ? 700 : 400, fontSize:12,
                        cursor:'pointer', fontFamily:'var(--font-body)',
                        boxShadow: playerTab===t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}>{labels[i]}</button>
                    );
                  })}
                </div>
              </div>

              {playerList.length === 0 ? (
                <div style={{ padding:'20px 16px', color:'var(--text-muted)', fontSize:13 }}>No data available</div>
              ) : playerList.slice(0,10).map((p:any, i:number) => {
                const value = playerTab==='scorers' ? (p.goals??0) : playerTab==='assists' ? (p.assists??0) : (p.goals??0)+(p.assists??0);
                return (
                  <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration:'none', display:'block' }}>
                    <div style={{
                      display:'flex', alignItems:'center', gap:12,
                      padding:'12px 16px',
                      borderTop: i>0 ? '1px solid var(--border)' : 'none',
                    }}>
                      {/* Avatar initials */}
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--bg-elevated)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'var(--text-muted)', flexShrink:0 }}>
                        {p.name.split(' ').map((n:string)=>n[0]??'').join('').substring(0,2).toUpperCase()}
                      </div>

                      {/* Name */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.position}</div>
                      </div>

                      {/* Value badge — red circle زي FotMob */}
                      <div style={{ width:34, height:34, borderRadius:'50%', background:'#e53e3e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#fff', flexShrink:0 }}>
                        {value}
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
