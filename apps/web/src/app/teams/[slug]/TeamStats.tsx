'use client';
import { useState } from 'react';

function seasonFull(s: string) {
  const y = parseInt(s);
  return `${y}/${y + 1}`;
}
function seasonShort(s: string) {
  const y = parseInt(s);
  return `${String(y).slice(2)}/${String(y + 1).slice(2)}`;
}

const ALL_SEASONS = ['2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015'];

type PlayerTab = 'scorers' | 'assists' | 'combined';
type MainTab   = 'players' | 'teams';

interface Props { stats: any; teamSlug?: string; overview?: any; standings?: any }

function PlayerCard({ title, players, tab }: { title: string; players: any[]; tab: PlayerTab }) {
  const getValue = (p: any) =>
    tab === 'scorers' ? (p.goals ?? 0) : tab === 'assists' ? (p.assists ?? 0) : (p.goals ?? 0) + (p.assists ?? 0);

  return (
    <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', minWidth: 0 }}>
      {/* Card header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
        <span style={{ fontSize: 11, color: 'var(--blue)', cursor: 'pointer' }}>›</span>
      </div>
      {players.length === 0 ? (
        <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--text-muted)' }}>No data</div>
      ) : players.slice(0, 5).map((p: any, i: number) => (
        <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            background: i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)',
          }}>
            {/* Avatar */}
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', flexShrink: 0 }}>
              {p.name.split(' ').map((n: string) => n[0] ?? '').join('').substring(0, 2).toUpperCase()}
            </div>
            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.position}</div>
            </div>
            {/* Value badge */}
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e53e3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              {getValue(p)}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function TeamStats({ stats, teamSlug, overview, standings }: Props) {
  const [season, setSeason]   = useState('2025');
  const [loading, setLoading] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>('players');

  const leagueName = standings?.league?.name ?? '';
  const leagueSlug = standings?.league?.slug ?? '';

  async function loadSeason(s: string) {
    if (s === season) return;
    setSeason(s);
    setLoading(true);
    try { await fetch(`/api/v1/teams/${teamSlug}/stats?season=${s}`); }
    catch {}
    setLoading(false);
  }

  const topScorers: any[]  = (overview?.topScorers ?? []).filter((p: any) => (p.goals ?? 0) > 0);
  const topAssists: any[]  = [...(overview?.topScorers ?? [])].sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0)).filter((p: any) => (p.assists ?? 0) > 0);
  const topCombined: any[] = [...(overview?.topScorers ?? [])].sort((a, b) => ((b.goals ?? 0) + (b.assists ?? 0)) - ((a.goals ?? 0) + (a.assists ?? 0)));

  return (
    <div>
      {/* League + Season header — مطابق FotMob */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {/* League logo circle */}
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', flexShrink: 0 }} />

        {/* League name + season as dropdown */}
        <div style={{ flex: 1 }}>
          <select
            value={season}
            onChange={e => loadSeason(e.target.value)}
            style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text)',
              background: 'transparent', border: 'none',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              outline: 'none', appearance: 'none',
              paddingRight: 20,
            }}
          >
            {ALL_SEASONS.map(s => (
              <option key={s} value={s}>{leagueName ? `${leagueName} ${seasonFull(s)}` : seasonFull(s)}</option>
            ))}
          </select>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: -14, pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      {/* Players / Teams toggle */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--bg-elevated)', borderRadius: 24, padding: 3, width: 'fit-content', border: '1px solid var(--border)' }}>
        {(['players', 'teams'] as MainTab[]).map(t => (
          <button key={t} onClick={() => setMainTab(t)} style={{
            padding: '6px 20px', borderRadius: 20, border: 'none',
            background: mainTab === t ? 'var(--bg-card)' : 'transparent',
            color: mainTab === t ? 'var(--text)' : 'var(--text-muted)',
            fontWeight: mainTab === t ? 700 : 400, fontSize: 13,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            boxShadow: mainTab === t ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            textTransform: 'capitalize',
          }}>{t === 'players' ? 'Players' : 'Teams'}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : mainTab === 'players' ? (
        <>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Top stats</h3>
          {topScorers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No player stats for this season</div>
            </div>
          ) : (
            /* 3 columns زي FotMob */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <PlayerCard title="Top scorer"      players={topScorers}  tab="scorers"  />
              <PlayerCard title="Assists"         players={topAssists}  tab="assists"  />
              <PlayerCard title="Goals + Assists" players={topCombined} tab="combined" />
            </div>
          )}
        </>
      ) : (
        /* Teams tab — إحصائيات الفريق */
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Team stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Goals per match',    value: stats?.played > 0 ? (Number(stats.goals_for) / Number(stats.played)).toFixed(1) : '-', color: '#22c55e' },
              { label: 'Goals conceded',     value: stats?.played > 0 ? (Number(stats.goals_against) / Number(stats.played)).toFixed(1) : '-', color: '#ef4444' },
              { label: 'Clean sheets',       value: stats?.clean_sheets ?? '-', color: 'var(--blue)' },
              { label: 'Win rate',           value: stats?.played > 0 ? `${Math.round((Number(stats.wins) / Number(stats.played)) * 100)}%` : '-', color: '#22c55e' },
              { label: 'Home wins',          value: stats?.home_wins ?? '-', color: 'var(--text)' },
              { label: 'Away wins',          value: stats?.away_wins ?? '-', color: 'var(--text)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '16px 12px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
