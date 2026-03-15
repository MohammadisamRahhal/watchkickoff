'use client';

const POS_LABEL: Record<string, string> = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' };
const POS_COLOR: Record<string, string> = { GK: '#f59e0b', DEF: '#3b82f6', MID: '#22c55e', FWD: '#ef4444' };
const POS_BG: Record<string, string> = { GK: '#fef3c7', DEF: '#dbeafe', MID: '#dcfce7', FWD: '#fee2e2' };

function getAge(dob: string | null): string {
  if (!dob) return '-';
  return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000).toString();
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[parts.length-1][0];
  return name.substring(0,2);
}

export default function TeamSquad({ squad }: { squad: any[] }) {
  if (!squad.length) return <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>No squad data available.</div>;

  const grouped = squad.reduce((acc: any, p: any) => {
    const pos = p.position ?? 'FWD';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(p);
    return acc;
  }, {});

  return (
    <div>
      {['GK', 'DEF', 'MID', 'FWD'].map(pos => {
        const players = grouped[pos];
        if (!players?.length) return null;
        return (
          <div key={pos} style={{ marginBottom: 28 }}>
            {/* Position header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '6px 0', borderBottom: '2px solid var(--border)' }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: POS_COLOR[pos] }} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{POS_LABEL[pos]}</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>({players.length})</span>
            </div>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 60px 60px 60px', gap: 8, padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: '6px 6px 0 0', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>#</span>
              <span>Player</span>
              <span>Nationality</span>
              <span style={{textAlign:'center'}}>Age</span>
              <span style={{textAlign:'center'}}>Height</span>
              <span style={{textAlign:'center'}}>Goals</span>
            </div>

            {/* Players */}
            {players.map((p: any, i: number) => (
              <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr 80px 60px 60px 60px',
                  gap: 8, padding: '10px 12px',
                  background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-elevated)',
                  borderBottom: '1px solid var(--border-subtle)',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                }}>
                  {/* Position badge */}
                  <div style={{ width: 24, height: 24, borderRadius: 4, background: POS_BG[pos], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: POS_COLOR[pos] }}>{pos}</div>

                  {/* Name + avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${POS_COLOR[pos]}18`, border: `2px solid ${POS_COLOR[pos]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: POS_COLOR[pos], flexShrink: 0, overflow: 'hidden' }}>
                      {getInitials(p.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{p.name}</div>
                      {p.preferred_foot && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.preferred_foot === 'RIGHT' ? '🦶 Right' : p.preferred_foot === 'LEFT' ? '🦶 Left' : '🦶 Both'}</div>}
                    </div>
                  </div>

                  {/* Nationality */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {p.nationality_code && (
                      <img src={`https://flagcdn.com/20x15/${p.nationality_code.toLowerCase()}.png`}
                        style={{ width: 18, height: 13, borderRadius: 2 }} alt={p.nationality_code}
                        onError={(e: any) => { e.target.style.display='none'; }} />
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.nationality_code ?? '-'}</span>
                  </div>

                  {/* Age */}
                  <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                    {getAge(p.date_of_birth)}
                  </div>

                  {/* Height */}
                  <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                    {p.height_cm ? `${p.height_cm}cm` : '-'}
                  </div>

                  {/* Goals */}
                  <div style={{ textAlign: 'center' }}>
                    {p.goals > 0
                      ? <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{p.goals}</span>
                      : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>-</span>
                    }
                  </div>
                </div>
              </a>
            ))}
          </div>
        );
      })}
    </div>
  );
}
