'use client';
import Link from 'next/link';

type Player = { id: string; teamId: string; playerName?: string; playerSlug?: string; shirtNumber?: number; positionCode?: string; formationSlot?: number; isStarter: boolean; isCaptain?: boolean; };

function PlayerDot({ p, color }: { p: Player; color: string }) {
  const lastName = p.playerName ? p.playerName.split(' ').slice(-1)[0] : '?';
  const content = (
    <>
      <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:'#fff', boxShadow:'0 2px 6px rgba(0,0,0,0.35)', position:'relative', flexShrink:0 }}>
        {p.shirtNumber || '?'}
        {p.isCaptain && (
          <span style={{ position:'absolute', top:'-4px', right:'-4px', background:'#f59e0b', color:'#000', borderRadius:'50%', width:'14px', height:'14px', fontSize:'0.45rem', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>C</span>
        )}
      </div>
      <span style={{ fontSize:'0.62rem', fontWeight:600, color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,0.9)', maxWidth:'62px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center', marginTop:'3px' }}>
        {lastName}
      </span>
    </>
  );

  if (p.playerSlug) {
    return (
      <Link href={`/players/${p.playerSlug}`} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', textDecoration:'none', cursor:'pointer' }}>
        {content}
      </Link>
    );
  }
  return <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>{content}</div>;
}

function TeamHalf({ players, name, crest, color, isTop }: { players: Player[]; name: string; crest?: string; color: string; isTop: boolean }) {
  const starters = players.filter(p => p.isStarter).sort((a,b) => (a.formationSlot||99)-(b.formationSlot||99));

  // Categorize by position
  const gk  = starters.filter(p => p.positionCode === 'GK' || p.formationSlot === 1);
  const def = starters.filter(p => ['CB','LB','RB','LWB','RWB'].includes(p.positionCode||'') || ([2,3,4,5].includes(p.formationSlot||0) && p.positionCode !== 'GK'));
  const mid = starters.filter(p => ['CM','CAM','CDM','LM','RM','DM'].includes(p.positionCode||'') || ([6,7,8,9].includes(p.formationSlot||0)));
  const fwd = starters.filter(p => ['ST','CF','LW','RW','SS'].includes(p.positionCode||'') || ([10,11].includes(p.formationSlot||0)));

  let rows: Player[][];
  if (gk.length + def.length + mid.length + fwd.length >= 9) {
    rows = [gk, def, mid, fwd].filter(r => r.length > 0);
  } else {
    const all = starters.slice(0,11);
    rows = [[all[0]], all.slice(1,5), all.slice(5,8), all.slice(8,11)].filter(r => r.length > 0);
  }

  // Top team: GK at top, FWD at bottom (towards center)
  const displayRows = isTop ? rows : [...rows].reverse();

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 0' }}>
      {/* Team label */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'6px', marginBottom:'4px' }}>
        {crest && <img src={crest} alt={name} width={20} height={20} style={{objectFit:'contain'}} onError={(e:any)=>{e.target.style.display='none';}} />}
        <span style={{ fontSize:'0.78rem', fontWeight:700, color:'rgba(255,255,255,0.9)', letterSpacing:'0.04em' }}>{name}</span>
      </div>
      {/* Rows */}
      <div style={{ display:'flex', flexDirection:'column', flex:1, justifyContent:'space-around', gap:'8px' }}>
        {displayRows.map((row, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-around', alignItems:'center', padding:'0 8px' }}>
            {row.map(p => <PlayerDot key={p.id} p={p} color={color} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LineupPitch({ lineups, homeTeamId, awayTeamId, homeTeamName, awayTeamName, homeTeamCrest, awayTeamCrest }: {
  lineups: Player[]; homeTeamId: string; awayTeamId: string;
  homeTeamName: string; awayTeamName: string;
  homeTeamCrest?: string; awayTeamCrest?: string;
}) {
  if (!lineups.length) return (
    <div style={{padding:'3rem',textAlign:'center',color:'var(--text-muted)',background:'var(--bg-card,#fff)',border:'1px solid var(--border)',borderRadius:'10px'}}>
      Lineups not available yet.
    </div>
  );

  const home = homeTeamId ? lineups.filter(p => p.teamId === homeTeamId) : [];
  const away = awayTeamId ? lineups.filter(p => p.teamId === awayTeamId) : [];
  const homeSubs = home.filter(p => !p.isStarter);
  const awaySubs = away.filter(p => !p.isStarter);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      {/* Pitch */}
      <div style={{
        background:'linear-gradient(180deg,#166534 0%,#15803d 12%,#166534 24%,#15803d 36%,#166534 48%,#15803d 60%,#166534 72%,#15803d 84%,#166534 100%)',
        borderRadius:'10px', overflow:'hidden', border:'3px solid rgba(255,255,255,0.15)',
        minHeight:'500px', display:'flex', flexDirection:'column', position:'relative'
      }}>
        {/* Field lines */}
        <div style={{ position:'absolute', top:'50%', left:'5%', right:'5%', height:'1px', background:'rgba(255,255,255,0.25)', transform:'translateY(-50%)' }} />
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'80px', height:'80px', borderRadius:'50%', border:'2px solid rgba(255,255,255,0.2)' }} />

        {/* Away team (top) */}
        <TeamHalf players={away} name={awayTeamName} crest={awayTeamCrest} color="#dc2626" isTop={true} />

        {/* Divider */}
        <div style={{ height:'1px', background:'rgba(255,255,255,0.3)', margin:'0 16px', flexShrink:0 }} />

        {/* Home team (bottom) */}
        <TeamHalf players={home} name={homeTeamName} crest={homeTeamCrest} color="#1d4ed8" isTop={false} />
      </div>

      {/* Substitutes */}
      {(homeSubs.length > 0 || awaySubs.length > 0) && (
        <div style={{ background:'var(--bg-card,#fff)', border:'1px solid var(--border,#e2e5ea)', borderRadius:'10px', overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 1fr' }}>
          {[{players: homeSubs, name: homeTeamName, color:'#1d4ed8'}, {players: awaySubs, name: awayTeamName, color:'#dc2626'}].map(({players, name, color}) => (
            <div key={name} style={{ borderRight: name===homeTeamName ? '1px solid var(--border,#e2e5ea)' : 'none' }}>
              <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', padding:'0.4rem 0.75rem', background:'var(--bg-elevated,#f0f2f5)', borderBottom:'1px solid var(--border)' }}>
                {name} — Subs
              </div>
              {players.map(p => (
                <Link key={p.id} href={p.playerSlug ? `/players/${p.playerSlug}` : '#'} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.3rem 0.75rem', borderBottom:'1px solid var(--border-subtle,#eceef1)', textDecoration:'none' }}>
                  <span style={{ width:'24px', height:'24px', borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {p.shirtNumber||'?'}
                  </span>
                  <span style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--text,#0f1923)', flex:1 }}>{p.playerName||'—'}</span>
                  <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{p.positionCode||''}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
