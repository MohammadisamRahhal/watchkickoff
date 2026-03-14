'use client';
import { useState, useRef, useEffect } from 'react';

interface Team { id: string; name: string; crest?: string; slug: string; }

interface Props {
  slug: string;
  season: string;
  group: string;
  teams: Team[];
  selectedTeamSlug?: string;
}

const PILL = (active: boolean): React.CSSProperties => ({
  padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
  textDecoration: 'none', border: '1px solid var(--border)',
  background: active ? '#1e40af' : 'var(--bg-card)',
  color: active ? '#fff' : 'var(--text-muted)',
  whiteSpace: 'nowrap', cursor: 'pointer', display: 'inline-block',
  transition: 'all 0.15s',
});

export default function GroupDropdown({ slug, season, group, teams, selectedTeamSlug }: Props) {
  const [teamOpen, setTeamOpen] = useState(false);
  const teamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (teamRef.current && !teamRef.current.contains(e.target as Node)) setTeamOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedTeam = teams.find(t => t.slug === selectedTeamSlug) ?? teams[0];

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Pills row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <a href={`/leagues/${slug}/fixtures?group=by-date`} style={PILL(group === 'by-date')}>By date</a>
        <a href={`/leagues/${slug}/fixtures?group=by-round`} style={PILL(group === 'by-round')}>By round</a>
        <a href={`/leagues/${slug}/fixtures?group=by-team`} style={PILL(group === 'by-team')}>By team</a>

        {/* Team selector — only when by-team */}
        {group === 'by-team' && teams.length > 0 && (
          <div ref={teamRef} style={{ position: 'relative', marginLeft: 8 }}>
            <button onClick={() => setTeamOpen(!teamOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text)', cursor: 'pointer', outline: 'none',
            }}>
              {selectedTeam?.crest && <img src={selectedTeam.crest} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />}
              <span>{selectedTeam?.name ?? 'Select team'}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', transform: teamOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', display: 'inline-block' }}>▼</span>
            </button>

            {teamOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, width: 220, maxHeight: 300, overflowY: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', scrollbarWidth: 'none',
              }}>
                {teams.map(team => (
                  <a key={team.id}
                    href={`/leagues/${slug}/fixtures?group=by-team&team=${team.slug}`}
                    onClick={() => setTeamOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', fontSize: 13, fontWeight: 500,
                      color: selectedTeamSlug === team.slug ? '#1e40af' : 'var(--text)',
                      textDecoration: 'none',
                      background: selectedTeamSlug === team.slug ? 'rgba(30,64,175,0.08)' : 'transparent',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}>
                    {team.crest && <img src={team.crest} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} alt="" />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
