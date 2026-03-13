'use client';
import { useState, useRef, useEffect } from 'react';

interface Team { id: string; name: string; crest?: string; slug: string; }

interface Props {
  slug: string;
  season: string;
  group: string;
  teams: Team[];
  selectedTeamSlug?: string;
  roundParam?: string;
}

export default function GroupDropdown({ slug, season, group, teams, selectedTeamSlug, roundParam }: Props) {
  const [open, setOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      if (teamRef.current && !teamRef.current.contains(e.target as Node)) setTeamOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const GROUP_OPTIONS = [
    { id: 'by-date',  label: 'By date' },
    { id: 'by-round', label: 'By round' },
    { id: 'by-team',  label: 'By team' },
  ];

  const currentGroup = GROUP_OPTIONS.find(g => g.id === group) ?? GROUP_OPTIONS[0];
  const selectedTeam = teams.find(t => t.slug === selectedTeamSlug) ?? teams[0];

  const groupHref = (g: string) => `/leagues/${slug}/fixtures?season=${season}&group=${g}`;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Group selector dropdown */}
      <div ref={ref} style={{ position: 'relative', display: 'inline-block', marginBottom: group === 'by-team' ? 12 : 0 }}>
        <button onClick={() => setOpen(!open)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 600,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text)', cursor: 'pointer', outline: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {currentGroup.label}
          <span style={{ fontSize: 10, color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s', display: 'inline-block' }}>▼</span>
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}>
            {GROUP_OPTIONS.map(opt => (
              <a key={opt.id} href={groupHref(opt.id)} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', fontSize: 14, fontWeight: 500,
                color: group === opt.id ? 'var(--green)' : 'var(--text)',
                textDecoration: 'none', background: group === opt.id ? 'var(--green-dim)' : 'transparent',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                {group === opt.id && <span style={{ fontSize: 12 }}>✓</span>}
                {group !== opt.id && <span style={{ width: 16 }} />}
                {opt.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Team selector — only when by-team */}
      {group === 'by-team' && teams.length > 0 && (
        <div ref={teamRef} style={{ position: 'relative', display: 'inline-block', marginLeft: 8 }}>
          <button onClick={() => setTeamOpen(!teamOpen)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 600,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text)', cursor: 'pointer', outline: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            {selectedTeam?.crest && <img src={selectedTeam.crest} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />}
            <span>{selectedTeam?.name ?? 'Select team'}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', transform: teamOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', display: 'inline-block' }}>▼</span>
          </button>

          {teamOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, width: 220, maxHeight: 320, overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              scrollbarWidth: 'none',
            }}>
              {teams.map(team => (
                <a key={team.id}
                  href={`/leagues/${slug}/fixtures?season=${season}&group=by-team&team=${team.slug}`}
                  onClick={() => setTeamOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', fontSize: 13, fontWeight: 500,
                    color: selectedTeamSlug === team.slug ? 'var(--green)' : 'var(--text)',
                    textDecoration: 'none',
                    background: selectedTeamSlug === team.slug ? 'var(--green-dim)' : 'transparent',
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
  );
}
