'use client';

const ZONE_COLOR: Record<string, string> = { PROMOTION: '#22c55e', CHAMPIONSHIP: '#3b82f6', RELEGATION: '#ef4444', NONE: 'transparent' };
const ZONE_BG: Record<string, string> = { PROMOTION: '#f0fdf4', CHAMPIONSHIP: '#eff6ff', RELEGATION: '#fef2f2', NONE: 'transparent' };

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
      {/* League header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <a href={`/leagues/${league.slug}/standings`} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>{league.name}</a>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>2025/26</span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 44px 44px 44px 44px 44px 44px 52px 80px', padding: '10px 16px', background: 'var(--bg-elevated)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid var(--border)' }}>
          <span>#</span><span>Team</span>
          <span style={{textAlign:'center'}}>P</span>
          <span style={{textAlign:'center'}}>W</span>
          <span style={{textAlign:'center'}}>D</span>
          <span style={{textAlign:'center'}}>L</span>
          <span style={{textAlign:'center'}}>GF</span>
          <span style={{textAlign:'center'}}>GA</span>
          <span style={{textAlign:'center'}}>Pts</span>
          <span style={{textAlign:'center'}}>Form</span>
        </div>

        {table.map((row: any, i: number) => {
          const isTeam = row.team_id === teamId;
          const formArr = (row.form ?? '').split('').slice(-5);
          const FC: Record<string,string> = { W: '#22c55e', D: '#f59e0b', L: '#ef4444' };

          return (
            <div key={row.team_id} style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 44px 44px 44px 44px 44px 44px 52px 80px',
              padding: '10px 16px',
              background: isTeam ? 'rgba(29,78,216,0.05)' : 'transparent',
              borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
              borderLeft: `4px solid ${isTeam ? 'var(--blue)' : ZONE_COLOR[row.zone ?? 'NONE']}`,
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: isTeam ? 800 : 500, color: isTeam ? 'var(--blue)' : 'var(--text-muted)' }}>{row.position}</span>

              <a href={`/teams/${row.team_slug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                {row.crest_url && <img src={row.crest_url} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />}
                <span style={{ fontSize: 13, fontWeight: isTeam ? 700 : 400, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.team_name}</span>
              </a>

              {[row.played, row.wins, row.draws, row.losses, row.goals_for, row.goals_against].map((v: any, j: number) => (
                <span key={j} style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>{v ?? 0}</span>
              ))}

              <span style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: isTeam ? 'var(--blue)' : 'var(--text)' }}>{row.points ?? 0}</span>

              {/* Form strip */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                {formArr.map((r: string, j: number) => (
                  <div key={j} style={{ width: 14, height: 14, borderRadius: '50%', background: FC[r] ?? '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{r}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {[['PROMOTION','#22c55e','UCL / Promotion'],['CHAMPIONSHIP','#3b82f6','Europa League'],['RELEGATION','#ef4444','Relegation']].map(([z,c,l]) => (
          <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c as string }} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}
