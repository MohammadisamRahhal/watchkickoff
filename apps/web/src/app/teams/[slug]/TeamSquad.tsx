'use client';

const POS_LABEL: Record<string, string> = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' };
const POS_COLOR: Record<string, string> = { GK: '#f59e0b', DEF: '#3b82f6', MID: '#22c55e', FWD: '#ef4444' };

function getAge(dob: string | null): string {
  if (!dob) return '-';
  return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000).toString();
}

function getDOB(dob: string | null): string {
  if (!dob) return '-';
  return new Date(dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface CoachInfo { name: string; photo?: string }
interface Props { squad: any[]; coach?: CoachInfo }

function HeaderRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 50px 90px 55px 50px', padding: '8px 14px', background: 'var(--bg-elevated)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>
      <span>Name</span><span>Nationality</span><span style={{textAlign:'center'}}>Age</span><span style={{textAlign:'center'}}>Date of Birth</span><span style={{textAlign:'center'}}>Height</span><span style={{textAlign:'center'}}>Goals</span>
    </div>
  );
}

export default function TeamSquad({ squad, coach }: Props) {
  if (!squad.length) return <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>No squad data available.</div>;

  const grouped = squad.reduce((acc: any, p: any) => {
    const pos = p.position ?? 'FWD';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(p);
    return acc;
  }, {});

  return (
    <div>
      {coach?.name && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg-elevated)', borderRadius: '8px 8px 0 0', borderBottom: '2px solid var(--border)' }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: '#6366f1' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Manager</span>
          </div>
          <HeaderRow />
          <div style={{ background: 'var(--bg-card)', borderRadius: '0 0 8px 8px', border: '1px solid var(--border)', borderTop: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 50px 90px 55px 50px', padding: '12px 14px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {coach.photo
                  ? <img src={coach.photo} alt={coach.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f118', border: '1.5px solid #6366f140', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#6366f1', flexShrink: 0 }}>{coach.name.charAt(0)}</div>
                }
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginRight: 8 }}>{coach.name}</span>
                  <span style={{ fontSize: 11, background: '#6366f118', color: '#6366f1', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Coach</span>
                </div>
              </div>
              {['-','-','-','-','-'].map((v,i) => <span key={i} style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{v}</span>)}
            </div>
          </div>
        </div>
      )}

      {['GK','DEF','MID','FWD'].map(pos => {
        const players = grouped[pos];
        if (!players?.length) return null;
        return (
          <div key={pos} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg-elevated)', borderRadius: '8px 8px 0 0', borderBottom: '2px solid var(--border)' }}>
              <div style={{ width: 4, height: 16, borderRadius: 2, background: POS_COLOR[pos] }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{POS_LABEL[pos]}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({players.length})</span>
            </div>
            <HeaderRow />
            <div style={{ background: 'var(--bg-card)', borderRadius: '0 0 8px 8px', border: '1px solid var(--border)', borderTop: 'none', overflow: 'hidden' }}>
              {players.map((p: any, i: number) => (
                <a key={p.id} href={`/players/${p.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 50px 90px 55px 50px', padding: '11px 14px', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-elevated)', borderBottom: i < players.length-1 ? '1px solid var(--border-subtle)' : 'none', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: POS_COLOR[pos]+'18', border: `1.5px solid ${POS_COLOR[pos]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: POS_COLOR[pos], flexShrink: 0 }}>
                        {p.name.split(' ').map((n:string)=>n[0]??'').join('').substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                        {p.preferred_foot && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.preferred_foot === 'RIGHT' ? 'Right' : p.preferred_foot === 'LEFT' ? 'Left' : 'Both'}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {p.nationality_code && <img src={`https://flagcdn.com/20x15/${p.nationality_code.toLowerCase()}.png`} style={{ width: 16, height: 12, borderRadius: 1 }} alt="" onError={(e:any)=>e.target.style.display='none'} />}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.nationality_code ?? '-'}</span>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{getAge(p.date_of_birth)}</div>
                    <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>{getDOB(p.date_of_birth)}</div>
                    <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{p.height_cm ? `${p.height_cm}` : '-'}</div>
                    <div style={{ textAlign: 'center' }}>
                      {p.goals > 0 ? <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{p.goals}</span> : <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>-</span>}
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
