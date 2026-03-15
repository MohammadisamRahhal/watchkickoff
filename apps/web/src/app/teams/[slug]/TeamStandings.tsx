'use client';

const ZONE_COLOR: Record<string, string> = {
  PROMOTION: '#22c55e',
  CHAMPIONSHIP: '#3b82f6',
  RELEGATION: '#ef4444',
  NONE: 'transparent',
};

export default function TeamStandings({ standings, teamId }: { standings: any; teamId: string }) {
  if (!standings?.table?.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>No standings data available.</div>
  );

  const { league, table } = standings;

  return (
    <div>
      {/* League header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 16px', background: '#1a1d27', borderRadius: 10, border: '1px solid #2a2d3a' }}>
        <a href={`/leagues/${league.slug}/standings`} style={{ fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>{league.name}</a>
        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>2025/26</span>
      </div>

      {/* Table */}
      <div style={{ background: '#1a1d27', borderRadius: 12, border: '1px solid #2a2d3a', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 40px 40px 40px 40px 40px 40px 50px', gap: 0, padding: '10px 16px', background: '#252a3d', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
          <span>#</span><span>Team</span><span style={{textAlign:'center'}}>P</span><span style={{textAlign:'center'}}>W</span><span style={{textAlign:'center'}}>D</span><span style={{textAlign:'center'}}>L</span><span style={{textAlign:'center'}}>GF</span><span style={{textAlign:'center'}}>GA</span><span style={{textAlign:'center'}}>Pts</span>
        </div>

        {table.map((row: any, i: number) => {
          const isTeam = row.team_id === teamId;
          return (
            <div key={row.team_id} style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 40px 40px 40px 40px 40px 40px 50px',
              gap: 0,
              padding: '10px 16px',
              background: isTeam ? 'rgba(59,130,246,0.12)' : 'transparent',
              borderTop: i > 0 ? '1px solid #2a2d3a' : 'none',
              borderLeft: isTeam ? '3px solid #3b82f6' : '3px solid transparent',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: ZONE_COLOR[row.zone ?? 'NONE'], marginRight: 4 }} />
                <span style={{ fontSize: 13, fontWeight: isTeam ? 800 : 500, color: isTeam ? '#3b82f6' : '#9ca3af' }}>{row.position}</span>
              </div>
              <a href={`/teams/${row.team_slug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                {row.crest_url && <img src={row.crest_url} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />}
                <span style={{ fontSize: 13, fontWeight: isTeam ? 800 : 500, color: isTeam ? '#fff' : '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.team_name}</span>
              </a>
              {[row.played, row.wins, row.draws, row.losses, row.goals_for, row.goals_against].map((v: any, j: number) => (
                <span key={j} style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>{v ?? 0}</span>
              ))}
              <span style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: isTeam ? '#3b82f6' : '#fff' }}>{row.points ?? 0}</span>
            </div>
          );
        })}
      </div>

      {/* Zone legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, padding: '0 4px', flexWrap: 'wrap' }}>
        {[['PROMOTION','#22c55e','Champions League / Promotion'],['CHAMPIONSHIP','#3b82f6','Europa League'],['RELEGATION','#ef4444','Relegation']].map(([zone, color, label]) => (
          <div key={zone} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color as string }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
