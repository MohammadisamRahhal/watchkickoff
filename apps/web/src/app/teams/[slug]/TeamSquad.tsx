'use client';

const POS_LABEL: Record<string, string> = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' };
const POS_COLOR: Record<string, string> = { GK: '#f59e0b', DEF: '#3b82f6', MID: '#22c55e', FWD: '#ef4444' };

function getAge(dob: string | null): string {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000).toString();
}

export default function TeamSquad({ squad }: { squad: any[] }) {
  if (!squad.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>No squad data available.</div>
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
          <div key={pos} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: POS_COLOR[pos] }} />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{POS_LABEL[pos]}</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({players.length})</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
              {players.map((p: any) => (
                <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--bg-card)', borderRadius: 8, padding: '10px 12px',
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: `${POS_COLOR[pos]}18`,
                      border: `2px solid ${POS_COLOR[pos]}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, color: POS_COLOR[pos], fontWeight: 800, flexShrink: 0,
                    }}>
                      {p.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, display: 'flex', gap: 6 }}>
                        {p.nationality_code && (
                          <img src={`https://flagcdn.com/16x12/${p.nationality_code.toLowerCase()}.png`}
                            style={{ width: 14, height: 11, borderRadius: 1 }} alt="" />
                        )}
                        <span>Age {getAge(p.date_of_birth)}</span>
                      </div>
                    </div>
                    {(p.goals > 0 || p.assists > 0) && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {p.goals > 0 && <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>⚽ {p.goals}</div>}
                        {p.assists > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.assists} ast</div>}
                      </div>
                    )}
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
