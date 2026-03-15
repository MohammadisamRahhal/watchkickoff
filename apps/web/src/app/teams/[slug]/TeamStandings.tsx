'use client';

const ZONE_COLOR: Record<string, string> = { PROMOTION: '#22c55e', CHAMPIONSHIP: '#3b82f6', RELEGATION: '#ef4444', NONE: 'transparent' };

export default function TeamStandings({ standings, teamId }: { standings: any; teamId: string }) {
  if (!standings?.table?.length) return <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>No standings data available.</div>;
  const { league, table } = standings;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
        <a href={`/leagues/${league.slug}/standings`} style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>{league.name}</a>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>2025/26</span>
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 36px 36px 36px 36px 36px 36px 44px', padding: '8px 14px', background: 'var(--bg-elevated)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          <span>#</span><span>Team</span><span style={{textAlign:'center'}}>P</span><span style={{textAlign:'center'}}>W</span><span style={{textAlign:'center'}}>D</span><span style={{textAlign:'center'}}>L</span><span style={{textAlign:'center'}}>GF</span><span style={{textAlign:'center'}}>GA</span><span style={{textAlign:'center'}}>Pts</span>
        </div>
        {table.map((row: any, i: number) => {
          const isTeam = row.team_id === teamId;
          return (
            <div key={row.team_id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 36px 36px 36px 36px 36px 36px 44px', padding: '9px 14px', background: isTeam ? 'rgba(29,78,216,0.06)' : 'transparent', borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none', borderLeft: isTeam ? '3px solid var(--blue)' : '3px solid transparent', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 2, height: 16, borderRadius: 1, background: ZONE_COLOR[row.zone ?? 'NONE'] }} />
                <span style={{ fontSize: 13, fontWeight: isTeam ? 800 : 500, color: isTeam ? 'var(--blue)' : 'var(--text-muted)' }}>{row.position}</span>
              </div>
              <a href={`/teams/${row.team_slug}`} style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
                {row.crest_url && <img src={row.crest_url} style={{ width: 18, height: 18, objectFit: 'contain' }} alt="" />}
                <span style={{ fontSize: 13, fontWeight: isTeam ? 700 : 400, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.team_name}</span>
              </a>
              {[row.played, row.wins, row.draws, row.losses, row.goals_for, row.goals_against].map((v: any, j: number) => (
                <span key={j} style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>{v ?? 0}</span>
              ))}
              <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: isTeam ? 'var(--blue)' : 'var(--text)' }}>{row.points ?? 0}</span>
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
