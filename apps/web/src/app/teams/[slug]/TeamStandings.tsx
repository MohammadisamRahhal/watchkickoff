'use client';
import { useState } from 'react';

const ZONE_COLOR: Record<string, string> = { PROMOTION: '#22c55e', CHAMPIONSHIP: '#3b82f6', RELEGATION: '#ef4444', NONE: 'transparent' };
const FC: Record<string, string> = { W: '#22c55e', D: '#f59e0b', L: '#ef4444' };
const ALL_SEASON_OPTS = ['2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015']
  .map(k => ({ key: k, label: `${k.slice(2)}/${String(Number(k)+1).slice(2)}` }));

type ViewType = 'overall' | 'home' | 'away';

interface Props { standings: any; teamId: string; teamSlug?: string }

export default function TeamStandings({ standings, teamId, teamSlug }: Props) {
  const [season, setSeason] = useState('2025');
  const [data, setData] = useState<any>(standings);
  const [loading, setLoading] = useState(false);
  const [activeLeagueId, setActiveLeagueId] = useState<string>(() => standings?.league?.id ?? '');
  const [view, setView] = useState<ViewType>('overall');

  async function loadSeason(s: string) {
    if (s === season) return;
    setSeason(s);
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/teams/${teamSlug}/standings?season=${s}`);
      const json = await res.json();
      setData(json.data);
      setActiveLeagueId(json.data?.league?.id ?? '');
    } catch { setData(null); }
    setLoading(false);
  }

  async function loadLeague(leagueId: string) {
    if (leagueId === activeLeagueId) return;
    setActiveLeagueId(leagueId);
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/teams/${teamSlug}/standings?season=${season}&leagueId=${leagueId}`);
      const json = await res.json();
      setData((prev: any) => ({ ...json.data, leagues: prev?.leagues }));
    } catch {}
    setLoading(false);
  }

  const leagues = data?.leagues ?? (data?.league ? [data.league] : []);
  const table   = data?.table ?? [];
  const sl      = ALL_SEASON_OPTS.find(s => s.key === season)?.label ?? season;

  // Build home/away table by overlaying homeStats/awayStats on the matching team row
  function getDisplayTable() {
    if (view === 'overall') return table;
    const stats = view === 'home' ? data?.homeStats : data?.awayStats;
    if (!stats) return table;
    return table.map((row: any) => {
      if (row.team_id !== teamId) return row;
      return {
        ...row,
        played:        Number(stats.played ?? 0),
        wins:          Number(stats.wins ?? 0),
        draws:         Number(stats.draws ?? 0),
        losses:        Number(stats.losses ?? 0),
        goals_for:     Number(stats.goals_for ?? 0),
        goals_against: Number(stats.goals_against ?? 0),
        points:        Number(stats.wins ?? 0) * 3 + Number(stats.draws ?? 0),
      };
    });
  }

  const displayTable = getDisplayTable();

  return (
    <div>
      {/* Season selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {ALL_SEASON_OPTS.map(s => (
          <button key={s.key} onClick={() => loadSeason(s.key)} style={{
            padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)',
            background: season === s.key ? 'var(--blue)' : 'var(--bg-card)',
            color: season === s.key ? '#fff' : 'var(--text-muted)',
            fontWeight: season === s.key ? 700 : 400, fontSize: 12,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font-body)',
          }}>{s.label}</button>
        ))}
      </div>

      {/* League tabs — all leagues this team is in */}
      {leagues.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {leagues.map((l: any) => (
            <button key={l.id} onClick={() => loadLeague(l.id)} style={{
              padding: '5px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: activeLeagueId === l.id ? 'var(--bg-elevated)' : 'var(--bg-card)',
              color: activeLeagueId === l.id ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: activeLeagueId === l.id ? 700 : 400, fontSize: 12,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font-body)',
              borderBottom: activeLeagueId === l.id ? '2px solid var(--blue)' : '1px solid var(--border)',
            }}>{l.name}</button>
          ))}
        </div>
      )}

      {/* League header + Home/Away toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
        {data?.league && (
          <a href={`/leagues/${data.league.slug}/standings`} style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', flex: 1 }}>
            {data.league.name} · {sl}
          </a>
        )}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {(['overall','home','away'] as ViewType[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)',
              background: view === v ? 'var(--blue)' : 'transparent',
              color: view === v ? '#fff' : 'var(--text-muted)',
              fontWeight: view === v ? 700 : 400, fontSize: 11,
              cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'var(--font-body)',
            }}>{v}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : !displayTable.length ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No standings for {sl}</div>
      ) : (
        <>
          <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px 40px 40px 40px 40px 40px 50px 90px', padding: '9px 16px', background: 'var(--bg-elevated)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
              <span>#</span><span>Club</span>
              <span style={{ textAlign: 'center' }}>P</span>
              <span style={{ textAlign: 'center' }}>W</span>
              <span style={{ textAlign: 'center' }}>D</span>
              <span style={{ textAlign: 'center' }}>L</span>
              <span style={{ textAlign: 'center' }}>GF</span>
              <span style={{ textAlign: 'center' }}>GA</span>
              <span style={{ textAlign: 'center' }}>Pts</span>
              <span style={{ textAlign: 'center' }}>Last 5</span>
            </div>

            {displayTable.map((row: any, i: number) => {
              const isTeam  = row.team_id === teamId;
              const formArr = (row.form ?? '').split('').slice(-5);
              const zoneColor = ZONE_COLOR[row.zone ?? 'NONE'];
              return (
                <div key={row.team_id} style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 40px 40px 40px 40px 40px 40px 50px 90px',
                  padding: '10px 16px',
                  background: isTeam ? 'rgba(29,78,216,0.06)' : i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)',
                  borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                  borderLeft: `3px solid ${isTeam ? 'var(--blue)' : zoneColor}`,
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 13, fontWeight: isTeam ? 800 : 500, color: isTeam ? 'var(--blue)' : 'var(--text-muted)' }}>{row.position}</span>

                  <a href={`/teams/${row.team_slug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', minWidth: 0 }}>
                    {row.crest_url && <img src={row.crest_url} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} alt="" onError={(e: any) => e.target.style.display='none'} />}
                    <span style={{ fontSize: 13, fontWeight: isTeam ? 700 : 400, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.team_name}</span>
                  </a>

                  {[row.played, row.wins, row.draws, row.losses, row.goals_for, row.goals_against].map((v: any, j: number) => (
                    <span key={j} style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{v ?? 0}</span>
                  ))}

                  <span style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: isTeam ? 'var(--blue)' : 'var(--text)' }}>{row.points ?? 0}</span>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                    {formArr.length > 0 ? formArr.map((r: string, j: number) => (
                      <div key={j} style={{ width: 16, height: 16, borderRadius: '50%', background: FC[r] ?? '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>{r}</div>
                    )) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>-</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {[['PROMOTION','#22c55e','UCL / Promotion'],['CHAMPIONSHIP','#3b82f6','Europa / Conf. League'],['RELEGATION','#ef4444','Relegation']].map(([z,c,l]) => (
              <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
