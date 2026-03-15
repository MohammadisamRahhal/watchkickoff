'use client';

const ZONE_COLOR: Record<string, string> = { PROMOTION: '#22c55e', CHAMPIONSHIP: '#3b82f6', RELEGATION: '#ef4444', NONE: 'transparent' };
const FC: Record<string, string> = { W: '#22c55e', D: '#f59e0b', L: '#ef4444' };

export default function TeamStandings({ standings, teamId }: { standings: any; teamId: string }) {
  if (!standings?.table?.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
      <div>No standings data available.</div>
    </div>
  );

  const { league, table } = standings;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <a href={`/leagues/${league.slug}/standings`} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>{league.name}</a>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', background: 'var(--bg-elevated)', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>25/26</span>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px 40px 40px 40px 40px 40px 50px 90px', padding: '9px 16px', background: 'var(--bg-elevated)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
          <span>#</span><span>Club</span>
          <span style={{textAlign:'center'}}>P</span><span style={{textAlign:'center'}}>W</span>
          <span style={{textAlign:'center'}}>D</span><span style={{textAlign:'center'}}>L</span>
          <span style={{textAlign:'center'}}>GF</span><span style={{textAlign:'center'}}>GA</span>
          <span style={{textAlign:'center'}}>Pts</span><span style={{textAlign:'center'}}>Last 5</span>
        </div>

        {table.map((row: any, i: number) => {
          const isTeam = row.team_id === teamId;
          const formArr = (row.form ?? '').split('').slice(-5);
          return (
            <div key={row.team_id} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 40px 40px 40px 40px 40px 40px 50px 90px',
              padding: '10px 16px',
              background: isTeam ? 'rgba(29,78,216,0.05)' : 'transparent',
              borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
              borderLeft: `3px solid ${isTeam ? 'var(--blue)' : ZONE_COLOR[row.zone ?? 'NONE']}`,
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: isTeam ? 800 : 500, color: isTeam ? 'var(--blue)' : 'var(--text-muted)' }}>{row.position}</span>
              <a href={`/teams/${row.team_slug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', minWidth: 0 }}>
                {row.crest_url && <img src={row.crest_url} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} alt="" />}
                <span style={{ fontSize: 13, fontWeight: isTeam ? 700 : 400, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.team_name}</span>
              </a>
              {[row.played, row.wins, row.draws, row.losses, row.goals_for, row.goals_against].map((v: any, j: number) => (
                <span key={j} style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{v ?? 0}</span>
              ))}
              <span style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: isTeam ? 'var(--blue)' : 'var(--text)' }}>{row.points ?? 0}</span>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                {formArr.length > 0
                  ? formArr.map((r: string, j: number) => (
                    <div key={j} style={{ width: 16, height: 16, borderRadius: '50%', background: FC[r] ?? '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>{r}</div>
                  ))
                  : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>-</span>
                }
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
        {[['PROMOTION','#22c55e','UCL / Promotion'],['CHAMPIONSHIP','#3b82f6','Europa League'],['RELEGATION','#ef4444','Relegation']].map(([z,c,l]) => (
          <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c as string }} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}
