'use client';
import { useState } from 'react';

const ZONE_COLOR: Record<string, string> = { PROMOTION: '#22c55e', CHAMPIONSHIP: '#3b82f6', RELEGATION: '#ef4444', NONE: 'transparent' };
const FC: Record<string, string> = { W: '#22c55e', D: '#f59e0b', L: '#ef4444' };
const ALL_SEASON_OPTS = ['2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015']
  .map(k => ({ key: k, label: `${k.slice(2)}/${String(Number(k)+1).slice(2)}` }));

type ViewType = 'all' | 'home' | 'away';
interface Props { standings: any; teamId: string; teamSlug?: string }

export default function TeamStandings({ standings, teamId, teamSlug }: Props) {
  const [season, setSeason] = useState('2025');
  const [data, setData] = useState<any>(standings);
  const [loading, setLoading] = useState(false);
  const [activeLeagueId, setActiveLeagueId] = useState<string>(() => standings?.league?.id ?? '');
  const [view, setView] = useState<ViewType>('all');

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

  function getDisplayTable() {
    if (view === 'all') return table;
    const stats = view === 'home' ? data?.homeStats : data?.awayStats;
    if (!stats) return table;
    return table.map((row: any) => {
      if (row.team_id !== teamId) return row;
      const w = Number(stats.wins ?? 0);
      const d = Number(stats.draws ?? 0);
      const l = Number(stats.losses ?? 0);
      const gf = Number(stats.goals_for ?? 0);
      const ga = Number(stats.goals_against ?? 0);
      return { ...row, played: Number(stats.played ?? 0), wins: w, draws: d, losses: l, goals_for: gf, goals_against: ga, goal_diff: gf - ga, points: w * 3 + d };
    });
  }

  const displayTable = getDisplayTable();

  return (
    <div>
      {/* All / Home / Away pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['all','home','away'] as ViewType[]).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '7px 20px', borderRadius: 20,
            border: '1px solid var(--border)',
            background: view === v ? 'var(--text)' : 'var(--bg-card)',
            color: view === v ? 'var(--bg-card)' : 'var(--text-muted)',
            fontWeight: view === v ? 700 : 400, fontSize: 13,
            cursor: 'pointer', textTransform: 'capitalize',
            fontFamily: 'var(--font-body)',
          }}>{v === 'all' ? 'All' : v === 'home' ? 'Home' : 'Away'}</button>
        ))}
      </div>

      {/* League header — with dropdown if multiple leagues */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
        {/* League logo placeholder */}
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', flexShrink: 0 }} />

        {leagues.length > 1 ? (
          <select value={activeLeagueId} onChange={e => loadLeague(e.target.value)}
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', outline: 'none', flex: 1 }}>
            {leagues.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        ) : (
          <a href={data?.league?.slug ? `/leagues/${data.league.slug}/standings` : '#'}
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', flex: 1 }}>
            {data?.league?.name ?? 'Standings'}
          </a>
        )}

        {/* Season dropdown */}
        <select value={season} onChange={e => loadSeason(e.target.value)}
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
          {ALL_SEASON_OPTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : !displayTable.length ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No standings for {sl}</div>
      ) : (
        <>
          <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 40px 36px 36px 36px 70px 36px 50px 80px', padding: '9px 16px', background: 'var(--bg-elevated)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', gap: 4 }}>
              <span>#</span>
              <span>Club</span>
              <span style={{ textAlign: 'center' }}>PL</span>
              <span style={{ textAlign: 'center' }}>W</span>
              <span style={{ textAlign: 'center' }}>D</span>
              <span style={{ textAlign: 'center' }}>L</span>
              <span style={{ textAlign: 'center' }}>+/-</span>
              <span style={{ textAlign: 'center' }}>GD</span>
              <span style={{ textAlign: 'center' }}>PTS</span>
              <span style={{ textAlign: 'center' }}>Form</span>
            </div>

            {displayTable.map((row: any, i: number) => {
              const isTeam  = row.team_id === teamId;
              const formArr = (row.form ?? '').split('').slice(-5);
              const gf = Number(row.goals_for ?? 0);
              const ga = Number(row.goals_against ?? 0);
              const gd = Number(row.goal_diff ?? (gf - ga));
              return (
                <div key={row.team_id} style={{
                  display: 'grid', gridTemplateColumns: '36px 1fr 40px 36px 36px 36px 70px 36px 50px 80px',
                  padding: '10px 16px', gap: 4,
                  background: isTeam ? 'rgba(29,78,216,0.06)' : i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)',
                  borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                  borderLeft: `3px solid ${isTeam ? 'var(--blue)' : ZONE_COLOR[row.zone ?? 'NONE']}`,
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 13, fontWeight: isTeam ? 800 : 500, color: isTeam ? 'var(--blue)' : 'var(--text-muted)' }}>{row.position}</span>

                  <a href={`/teams/${row.team_slug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', minWidth: 0 }}>
                    {row.crest_url && <img src={row.crest_url} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} alt="" onError={(e: any) => e.target.style.display='none'} />}
                    <span style={{ fontSize: 13, fontWeight: isTeam ? 700 : 400, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.team_name}</span>
                  </a>

                  <span style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{row.played ?? 0}</span>
                  <span style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{row.wins ?? 0}</span>
                  <span style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{row.draws ?? 0}</span>
                  <span style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{row.losses ?? 0}</span>

                  {/* +/- goals */}
                  <span style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{gf}-{ga}</span>

                  {/* GD */}
                  <span style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: gd > 0 ? '#22c55e' : gd < 0 ? '#ef4444' : 'var(--text-muted)' }}>
                    {gd > 0 ? `+${gd}` : gd}
                  </span>

                  {/* PTS */}
                  <span style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: isTeam ? 'var(--blue)' : 'var(--text)' }}>{row.points ?? 0}</span>

                  {/* Form */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                    {formArr.length > 0 ? formArr.map((r: string, j: number) => (
                      <div key={j} style={{ width: 14, height: 14, borderRadius: '50%', background: FC[r] ?? '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{r}</div>
                    )) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>-</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {[['#22c55e','UCL / Promotion'],['#3b82f6','Europa / Conf. League'],['#ef4444','Relegation']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
