'use client';
import { useState, useMemo } from 'react';

type FilterType = 'all' | 'upcoming' | 'results' | 'home' | 'away';

interface Props {
  fixtures: any[];
  results: any[];
  teamId: string;
  teamSlug?: string;
}

export default function TeamFixtures({ fixtures, results, teamId, teamSlug }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');

  const allMatches = useMemo(() => {
    const map = new Map();
    [...fixtures, ...results].forEach(m => map.set(m.id, m));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime()
    );
  }, [fixtures, results]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'upcoming': return allMatches.filter(m => m.status !== 'FINISHED').sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime());
      case 'results':  return allMatches.filter(m => m.status === 'FINISHED');
      case 'home':     return allMatches.filter(m => m.home_team_id === teamId);
      case 'away':     return allMatches.filter(m => m.away_team_id === teamId);
      default:         return allMatches;
    }
  }, [allMatches, filter, teamId]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    filtered.forEach(m => {
      const key = new Date(m.kickoff_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [filtered]);

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all',      label: `All (${allMatches.length})` },
    { id: 'results',  label: `Results (${allMatches.filter(m => m.status === 'FINISHED').length})` },
    { id: 'upcoming', label: `Upcoming (${allMatches.filter(m => m.status !== 'FINISHED').length})` },
    { id: 'home',     label: `Home (${allMatches.filter(m => m.home_team_id === teamId).length})` },
    { id: 'away',     label: `Away (${allMatches.filter(m => m.away_team_id === teamId).length})` },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)',
            background: filter === f.id ? 'var(--blue)' : 'var(--bg-card)',
            color: filter === f.id ? '#fff' : 'var(--text-muted)',
            fontWeight: filter === f.id ? 700 : 400, fontSize: 12,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            fontFamily: 'var(--font-body)',
          }}>{f.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No matches found</div>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([month, ms]) => (
          <div key={month} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '5px 0', marginBottom: 6, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{month}</span>
              <span style={{ fontWeight: 400 }}>{ms.length} matches</span>
            </div>
            {ms.map((m: any) => {
              const isHome     = m.home_team_id === teamId;
              const isFinished = m.status === 'FINISHED';
              const isLive     = ['LIVE_1H','LIVE_2H','HALF_TIME','EXTRA_TIME','PENALTIES'].includes(m.status);
              const gs = isHome ? Number(m.home_score) : Number(m.away_score);
              const ga = isHome ? Number(m.away_score) : Number(m.home_score);
              const result = isFinished ? (gs > ga ? 'W' : gs < ga ? 'L' : 'D') : null;
              const rc = result === 'W' ? '#22c55e' : result === 'L' ? '#ef4444' : '#f59e0b';
              const d  = new Date(m.kickoff_at);
              return (
                <a key={m.id} href={`/matches/${m.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isLive ? '#f0f6ff' : 'var(--bg-card)', borderRadius: 8, marginBottom: 4, border: '1px solid var(--border)', borderLeft: isLive ? '3px solid #1d4ed8' : '1px solid var(--border)' }}>
                    <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{d.getDate()}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                    </div>
                    <div style={{ width: 80, flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.league_name}</div>
                      {m.round && <div style={{ fontSize: 9, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.round}</div>}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'flex-end', minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: m.home_team_id === teamId ? 700 : 400, color: m.home_team_id === teamId ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.home_name}</span>
                        {m.home_crest && <img src={m.home_crest} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} alt="" onError={(e: any) => e.target.style.display = 'none'} />}
                      </div>
                      <div style={{ minWidth: 58, textAlign: 'center', flexShrink: 0, background: isFinished ? 'var(--bg-elevated)' : 'transparent', borderRadius: 6, padding: isFinished ? '3px 8px' : '0', border: isFinished ? '1px solid var(--border)' : 'none' }}>
                        {isFinished ? (
                          <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)' }}>{m.home_score} - {m.away_score}</span>
                        ) : isLive ? (
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>
                            {m.home_score ?? 0} - {m.away_score ?? 0}
                            <span style={{ display: 'block', fontSize: 9, color: '#ef4444', fontWeight: 700 }}>LIVE</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
                        {m.away_crest && <img src={m.away_crest} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} alt="" onError={(e: any) => e.target.style.display = 'none'} />}
                        <span style={{ fontSize: 13, fontWeight: m.away_team_id === teamId ? 700 : 400, color: m.away_team_id === teamId ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.away_name}</span>
                      </div>
                    </div>
                    {result && <div style={{ width: 24, height: 24, borderRadius: '50%', background: rc, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 10, flexShrink: 0 }}>{result}</div>}
                    <div style={{ fontSize: 10, fontWeight: 700, color: isHome ? 'var(--blue)' : 'var(--text-muted)', width: 14, textAlign: 'center', flexShrink: 0 }}>{isHome ? 'H' : 'A'}</div>
                  </div>
                </a>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
