'use client';
import { useState } from 'react';

const POS_LABEL: Record<string, string> = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' };
const POS_COLOR: Record<string, string> = { GK: '#f59e0b', DEF: '#3b82f6', MID: '#22c55e', FWD: '#ef4444' };
const POS_BG:    Record<string, string> = { GK: '#f59e0b18', DEF: '#3b82f618', MID: '#22c55e18', FWD: '#ef444418' };

function getAge(dob: string | null): string {
  if (!dob) return '-';
  return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000).toString();
}

type ViewMode = 'list' | 'grid';
interface CoachInfo { name: string; photo?: string }
interface Props { squad: any[]; coach?: CoachInfo }

function PlayerAvatar({ player, pos, size = 36 }: { player: any; pos: string; size?: number }) {
  const initials = player.name.split(' ').map((n: string) => n[0] ?? '').join('').substring(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: POS_BG[pos] ?? 'var(--bg-elevated)', border: `1.5px solid ${POS_COLOR[pos] ?? 'var(--border)'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: 800, color: POS_COLOR[pos] ?? 'var(--text-muted)', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function TeamSquad({ squad, coach }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  if (!squad.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>No squad data available</div>
    </div>
  );

  const grouped = squad.reduce((acc: any, p: any) => {
    const pos = p.position ?? 'FWD';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text)' }}>{squad.length}</strong> players · Season 25/26
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['list', 'grid'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: viewMode === m ? 'var(--blue)' : 'var(--bg-card)', color: viewMode === m ? '#fff' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              {m === 'list' ? '☰ List' : '⊞ Grid'}
            </button>
          ))}
        </div>
      </div>

      {coach?.name && (
        <div style={{ marginBottom: 20, background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: '#6366f1' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manager</span>
          </div>
          <a href={`/coaches/${coach.name.toLowerCase().replace(/\s+/g, '-')}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
              {coach.photo
                ? <img src={coach.photo} alt={coach.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#6366f118', border: '1.5px solid #6366f140', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#6366f1', flexShrink: 0 }}>{coach.name.charAt(0)}</div>
              }
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{coach.name}</div>
                <span style={{ fontSize: 11, background: '#6366f118', color: '#6366f1', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Head Coach</span>
              </div>
            </div>
          </a>
        </div>
      )}

      {['GK','DEF','MID','FWD'].map(pos => {
        const players = grouped[pos];
        if (!players?.length) return null;
        return (
          <div key={pos} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg-elevated)', borderRadius: '10px 10px 0 0', border: '1px solid var(--border)', borderBottom: `2px solid ${POS_COLOR[pos]}` }}>
              <div style={{ width: 4, height: 16, borderRadius: 2, background: POS_COLOR[pos] }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{POS_LABEL[pos]}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({players.length})</span>
            </div>

            {viewMode === 'list' ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 44px 80px 50px 50px 50px', padding: '7px 14px', background: 'var(--bg-elevated)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>
                  <span>#</span><span>Name</span><span>Nat.</span>
                  <span style={{ textAlign: 'center' }}>Age</span>
                  <span style={{ textAlign: 'center' }}>Height</span>
                  <span style={{ textAlign: 'center' }}>Apps</span>
                  <span style={{ textAlign: 'center' }}>⚽</span>
                  <span style={{ textAlign: 'center' }}>🅰</span>
                </div>
                {players.map((p: any, i: number) => (
                  <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 44px 80px 50px 50px 50px', padding: '10px 14px', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-elevated)', borderBottom: i < players.length - 1 ? '1px solid var(--border-subtle)' : 'none', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: POS_COLOR[pos], textAlign: 'center' }}>{p.shirt_number ?? (i + 1)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <PlayerAvatar player={p} pos={pos} size={30} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          {p.preferred_foot && <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{p.preferred_foot === 'RIGHT' ? 'Right' : p.preferred_foot === 'LEFT' ? 'Left' : 'Both'} foot</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {p.nationality_code && <img src={`https://flagcdn.com/20x15/${p.nationality_code.toLowerCase()}.png`} style={{ width: 16, height: 12, borderRadius: 1 }} alt="" onError={(e: any) => e.target.style.display = 'none'} />}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.nationality_code ?? '-'}</span>
                      </div>
                      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{getAge(p.date_of_birth)}</div>
                      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{p.height_cm ? `${p.height_cm} cm` : '-'}</div>
                      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{p.appearances ?? '-'}</div>
                      <div style={{ textAlign: 'center' }}>{p.goals > 0 ? <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{p.goals}</span> : <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>-</span>}</div>
                      <div style={{ textAlign: 'center' }}>{p.assists > 0 ? <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{p.assists}</span> : <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>-</span>}</div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
                {players.map((p: any) => (
                  <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 10, border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                        <PlayerAvatar player={p} pos={pos} size={44} />
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: POS_COLOR[pos], lineHeight: 1 }}>{p.shirt_number ?? '—'}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{getAge(p.date_of_birth)} yrs</div>
                      {(p.goals > 0 || p.assists > 0) && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                          {p.goals > 0 && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>⚽{p.goals}</span>}
                          {p.assists > 0 && <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700 }}>🅰{p.assists}</span>}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
