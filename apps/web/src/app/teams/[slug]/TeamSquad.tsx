'use client';

const POS_LABEL: Record<string, string> = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' };
const POS_COLOR: Record<string, string> = { GK: '#f59e0b', DEF: '#3b82f6', MID: '#22c55e', FWD: '#ef4444' };

function getAge(dob: string | null): string {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / 31557600000).toString();
}

export default function TeamSquad({ squad }: { squad: any[] }) {
  if (!squad.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>No squad data available.</div>
  );

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: POS_COLOR[pos] }} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{POS_LABEL[pos]}</h3>
              <span style={{ fontSize: 12, color: '#6b7280' }}>({players.length})</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {players.map((p: any) => (
                <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#1a1d27', borderRadius: 10, padding: '12px 14px',
                    border: '1px solid #2a2d3a', display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'border-color 0.2s',
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: `${POS_COLOR[pos]}22`,
                      border: `2px solid ${POS_COLOR[pos]}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, color: POS_COLOR[pos], fontWeight: 800, flexShrink: 0,
                    }}>
                      {p.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'flex', gap: 6 }}>
                        {p.nationality_code && <span>🏳️ {p.nationality_code}</span>}
                        <span>Age {getAge(p.date_of_birth)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {p.goals > 0 && <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>⚽ {p.goals}</div>}
                      {p.assists > 0 && <div style={{ fontSize: 11, color: '#6b7280' }}>{p.assists} ast</div>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
