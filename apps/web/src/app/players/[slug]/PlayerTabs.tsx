'use client';
import { useState } from 'react';
import Link from 'next/link';

interface Props { stats:any[]; career:any[]; recentMatches:any[]; player:any; }
const TABS = ['Overview','Stats','Career','Matches','Profile'] as const;
type Tab = typeof TABS[number];

export default function PlayerTabs({ stats, career, recentMatches, player }: Props) {
  const [active, setActive] = useState<Tab>('Overview');
  return (
    <>
      {/* Tabs — نفس تصميم LeagueHeader */}
      <div style={{ display:'flex', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg) var(--radius-lg) 0 0', borderBottom:'1px solid var(--border)', overflowX:'auto', scrollbarWidth:'none' }}>
        {TABS.map(t => (
          <button key={t} onClick={()=>setActive(t)} style={{
            padding:'13px 20px', fontSize:12, fontWeight:700, letterSpacing:'0.07em',
            whiteSpace:'nowrap', background:'none', border:'none', cursor:'pointer',
            fontFamily:'var(--font-display)', color: active===t?'var(--text)':'var(--text-dim)',
            borderBottom: active===t?'2px solid var(--green)':'2px solid transparent',
            marginBottom:-1,
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 var(--radius-lg) var(--radius-lg)', padding:'20px 24px', marginBottom:12 }}>
        {active==='Overview' && <OverviewTab stats={stats} matches={recentMatches} player={player}/>}
        {active==='Stats'    && <StatsTab stats={stats}/>}
        {active==='Career'   && <CareerTab career={career}/>}
        {active==='Matches'  && <MatchesTab matches={recentMatches}/>}
        {active==='Profile'  && <ProfileTab player={player}/>}
      </div>
    </>
  );
}

function OverviewTab({stats,matches,player}:{stats:any[];matches:any[];player:any}) {
  const cur = stats.filter((s:any)=>s.season==='2025');
  const T = cur.reduce((a:any,s:any)=>({
    goals:a.goals+(s.goals||0), assists:a.assists+(s.assists||0),
    apps:a.apps+(s.appearances||0), mins:a.mins+(s.minutesPlayed||0),
    shots:a.shots+(s.shotsTotal||0), shotsOT:a.shotsOT+(s.shotsOnTarget||0),
    yellow:a.yellow+(s.yellowCards||0),
  }),{goals:0,assists:0,apps:0,mins:0,shots:0,shotsOT:0,yellow:0});

  const pos=player.position??'FWD';
  const MX:Record<string,Record<string,number>>={
    FWD:{Goals:30,Assists:15,Shots:120,Mins:3000,'G/90':2,'On Tgt':1},
    MID:{Goals:15,Assists:20,Shots:80,Mins:3000,'G/90':1,'On Tgt':1},
    DEF:{Goals:5,Assists:8,Shots:30,Mins:3000,'G/90':0.5,'On Tgt':1},
    GK:{Goals:1,Assists:2,Shots:10,Mins:3000,'G/90':0.1,'On Tgt':1},
  };
  const mx=MX[pos]??MX.FWD;
  const radarData=[
    {label:'Goals',  value:Math.min(T.goals/mx.Goals,1)},
    {label:'Assists',value:Math.min(T.assists/mx.Assists,1)},
    {label:'Shots',  value:Math.min(T.shots/mx.Shots,1)},
    {label:'Mins',   value:Math.min(T.mins/mx.Mins,1)},
    {label:'G/90',   value:T.mins>90?Math.min(((T.goals/T.mins)*90)/mx['G/90'],1):0},
    {label:'On Tgt', value:T.shots>0?Math.min(T.shotsOT/T.shots,1):0},
  ];

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      {/* Radar */}
      <div style={{background:'var(--bg-elevated)',borderRadius:'var(--radius)',padding:'16px',border:'1px solid var(--border)'}}>
        <div style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:12,fontFamily:'var(--font-display)'}}>Player Radar 2025/26</div>
        <div style={{display:'flex',justifyContent:'center'}}><RadarChart data={radarData}/></div>
      </div>

      {/* Season at a glance */}
      <div style={{background:'var(--bg-elevated)',borderRadius:'var(--radius)',padding:'16px',border:'1px solid var(--border)'}}>
        <div style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:12,fontFamily:'var(--font-display)'}}>Season at a Glance</div>
        {[
          {label:'Goals',    val:T.goals,   max:Math.max(T.goals,30),   color:'var(--green)'},
          {label:'Assists',  val:T.assists, max:Math.max(T.assists,20),  color:'var(--blue-bright)'},
          {label:'Shots',    val:T.shots,   max:Math.max(T.shots,100),   color:'#8b5cf6'},
          {label:'On Target',val:T.shotsOT, max:Math.max(T.shots,100),   color:'var(--green)'},
          {label:'Yellows',  val:T.yellow,  max:Math.max(T.yellow,15),   color:'var(--yellow)'},
        ].map(({label,val,max,color})=>(
          <div key={label} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <span style={{fontSize:12,color:'var(--text-muted)',width:72,textAlign:'right',flexShrink:0}}>{label}</span>
            <div style={{flex:1,height:6,background:'var(--border)',borderRadius:99,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:99,background:color,width:max>0?`${Math.min((val/max)*100,100)}%`:'0%'}}/>
            </div>
            <span style={{fontSize:12,fontWeight:700,color:'var(--text)',width:24}}>{val}</span>
          </div>
        ))}
      </div>

      {/* Recent Form */}
      <div style={{background:'var(--bg-elevated)',borderRadius:'var(--radius)',padding:'16px',border:'1px solid var(--border)'}}>
        <div style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:12,fontFamily:'var(--font-display)'}}>Recent Form</div>
        {matches.length===0 ? <p style={{color:'var(--text-dim)',fontSize:13,textAlign:'center',padding:'16px 0'}}>No recent matches</p> : (
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {matches.slice(0,8).map((m:any,i:number)=>(
              <Link key={i} href={`/matches/${m.slug}`} style={{width:42,height:42,borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text)',textDecoration:'none',flexDirection:'column',gap:1}}>
                <span>{m.homeScore}–{m.awayScore}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Profile */}
      <div style={{background:'var(--bg-elevated)',borderRadius:'var(--radius)',padding:'16px',border:'1px solid var(--border)'}}>
        <div style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:12,fontFamily:'var(--font-display)'}}>Quick Profile</div>
        {[
          {l:'Position',v:({GK:'Goalkeeper',DEF:'Defender',MID:'Midfielder',FWD:'Forward'} as any)[player.position]??player.position??'—'},
          {l:'Age',     v:player.age?`${player.age} years`:'—'},
          {l:'Height',  v:player.heightCm?`${player.heightCm} cm`:'—'},
          {l:'Foot',    v:player.preferredFoot??'—'},
          {l:'Club',    v:player.currentTeam?.name??'—'},
          {l:'Status',  v:player.status??'—'},
        ].map(({l,v})=>(
          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border-subtle)'}}>
            <span style={{fontSize:13,color:'var(--text-muted)'}}>{l}</span>
            <span style={{fontSize:13,color:'var(--text)',fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarChart({data}:{data:Array<{label:string;value:number}>}) {
  const n=data.length,cx=110,cy=100,R=80;
  const angles=data.map((_,i)=>(Math.PI*2*i)/n-Math.PI/2);
  const pt=(r:number,i:number)=>({x:cx+r*Math.cos(angles[i]),y:cy+r*Math.sin(angles[i])});
  const rings=[0.25,0.5,0.75,1];
  const outline=rings.map(r=>angles.map((_,i)=>pt(R*r,i)).map((p,j)=>`${j===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+'Z');
  const filled=data.map((d,i)=>pt(R*d.value,i)).map((p,j)=>`${j===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+'Z';
  return (
    <svg width={220} height={210} viewBox="0 0 220 210">
      {outline.map((d,i)=><path key={i} d={d} fill="none" stroke="var(--border)" strokeWidth={1}/>)}
      {angles.map((_,i)=>{const p=pt(R,i);return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={1}/>;} )}
      <path d={filled} fill="rgba(30,64,175,0.12)" stroke="var(--green)" strokeWidth={2} strokeLinejoin="round"/>
      {data.map((d,i)=>{const p=pt(R*d.value,i);return <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--green)" stroke="white" strokeWidth={1.5}/>;} )}
      {data.map((d,i)=>{
        const p=pt(R+18,i);
        const anchor=Math.abs(Math.cos(angles[i]))<0.15?'middle':Math.cos(angles[i])>0?'start':'end';
        return <text key={i} x={p.x} y={p.y} fill="var(--text-muted)" fontSize={9} textAnchor={anchor} dominantBaseline="central" fontWeight={700}>{d.label}</text>;
      })}
    </svg>
  );
}

function StatsTab({stats}:{stats:any[]}) {
  const seasons=[...new Set(stats.map((s:any)=>s.season))].sort((a,b)=>b.localeCompare(a));
  const [szn,setSzn]=useState(seasons[0]??'2025');
  const filtered=stats.filter((s:any)=>s.season===szn);
  const sznLabel=(s:string)=>s==='2025'?'25/26':s==='2026'?'26/27':s;
  if(!stats.length) return <p style={{color:'var(--text-dim)',textAlign:'center',padding:'2rem'}}>No stats available yet.</p>;
  return (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {seasons.map(s=>(
          <button key={s} onClick={()=>setSzn(s)} style={{padding:'4px 14px',borderRadius:99,border:`1.5px solid ${s===szn?'var(--green)':'var(--border)'}`,background:s===szn?'var(--green-dim)':'transparent',color:s===szn?'var(--green)':'var(--text-muted)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-display)',letterSpacing:'0.04em'}}>
            {sznLabel(s)}
          </button>
        ))}
      </div>
      {filtered.length===0?<p style={{color:'var(--text-dim)',textAlign:'center',padding:'2rem'}}>No data.</p>:(
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{background:'var(--bg-elevated)'}}>
                {['Competition','Club','Apps','Goals','Ast','Shots','On Tgt','Mins','G/90','A/90','🟡','🟥','Rating'].map(h=>(
                  <th key={h} style={{padding:'8px 10px',textAlign:h==='Competition'||h==='Club'?'left':'center',fontSize:10,fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.07em',borderBottom:'2px solid var(--border)',whiteSpace:'nowrap',fontFamily:'var(--font-display)'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s:any,i:number)=>{
                const g90=s.minutesPlayed>0?((s.goals/s.minutesPlayed)*90).toFixed(2):'—';
                const a90=s.minutesPlayed>0?((s.assists/s.minutesPlayed)*90).toFixed(2):'—';
                return (
                  <tr key={i} style={{borderBottom:'1px solid var(--border-subtle)'}}>
                    <td style={{padding:'10px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        {s.league.logo&&<img src={s.league.logo} alt="" width={16} height={16} style={{objectFit:'contain',borderRadius:2}} onError={(e:any)=>{e.currentTarget.style.display='none';}}/>}
                        <Link href={`/leagues/${s.league.slug}/fixtures`} style={{color:'var(--text-muted)',fontSize:13}}>{s.league.name}</Link>
                      </div>
                    </td>
                    <td style={{padding:'10px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        {s.team.crest&&<img src={s.team.crest} alt="" width={16} height={16} style={{objectFit:'contain',borderRadius:2}} onError={(e:any)=>{e.currentTarget.style.display='none';}}/>}
                        <Link href={`/teams/${s.team.slug}`} style={{color:'var(--text-muted)',fontSize:12}}>{s.team.name}</Link>
                      </div>
                    </td>
                    <td style={{textAlign:'center',padding:'10px',color:'var(--text-muted)'}}>{s.appearances||'—'}</td>
                    <td style={{textAlign:'center',padding:'10px',fontWeight:s.goals>0?700:400,color:s.goals>0?'var(--green)':'var(--text-muted)'}}>{s.goals||'—'}</td>
                    <td style={{textAlign:'center',padding:'10px',fontWeight:s.assists>0?700:400,color:s.assists>0?'var(--blue-bright)':'var(--text-muted)'}}>{s.assists||'—'}</td>
                    <td style={{textAlign:'center',padding:'10px',color:'var(--text-muted)'}}>{s.shotsTotal||'—'}</td>
                    <td style={{textAlign:'center',padding:'10px',color:'var(--text-muted)'}}>{s.shotsOnTarget||'—'}</td>
                    <td style={{textAlign:'center',padding:'10px',color:'var(--text-muted)'}}>{s.minutesPlayed?s.minutesPlayed.toLocaleString():'—'}</td>
                    <td style={{textAlign:'center',padding:'10px',color:'var(--text-muted)'}}>{g90}</td>
                    <td style={{textAlign:'center',padding:'10px',color:'var(--text-muted)'}}>{a90}</td>
                    <td style={{textAlign:'center',padding:'10px',color:s.yellowCards>0?'var(--yellow)':'var(--text-dim)'}}>{s.yellowCards||'—'}</td>
                    <td style={{textAlign:'center',padding:'10px',color:s.redCards>0?'var(--red)':'var(--text-dim)'}}>{s.redCards||'—'}</td>
                    <td style={{textAlign:'center',padding:'10px',fontWeight:700,color:s.rating?'var(--green)':'var(--text-dim)'}}>{s.rating?parseFloat(s.rating).toFixed(1):'—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CareerTab({career}:{career:any[]}) {
  if(!career.length) return <p style={{color:'var(--text-dim)',textAlign:'center',padding:'2rem'}}>No career history.</p>;
  const bySzn:Record<string,any[]>={};
  career.forEach((r:any)=>{(bySzn[r.season]=bySzn[r.season]??[]).push(r);});
  const sznLabel=(s:string)=>s==='2025'?'25/26':s==='2026'?'26/27':s;
  return (
    <div style={{position:'relative',paddingLeft:28}}>
      <div style={{position:'absolute',left:8,top:8,bottom:8,width:2,background:'var(--border)',borderRadius:1}}/>
      {Object.entries(bySzn).sort(([a],[b])=>b.localeCompare(a)).map(([szn,rows])=>(
        <div key={szn} style={{position:'relative',display:'grid',gridTemplateColumns:'64px 1fr',gap:16,marginBottom:24,alignItems:'flex-start'}}>
          <div style={{position:'absolute',left:-28,top:4,width:18,height:18,borderRadius:'50%',border:'2px solid var(--green)',background:'var(--bg-card)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'var(--green)'}}/>
          </div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text-muted)',paddingTop:2,fontFamily:'var(--font-display)',letterSpacing:'0.04em'}}>{sznLabel(szn)}</div>
          <div>
            {rows.map((r:any,i:number)=>(
              <div key={i} style={{marginBottom:i<rows.length-1?16:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  {r.team.crest&&<img src={r.team.crest} alt="" width={22} height={22} style={{borderRadius:3,objectFit:'contain'}} onError={(e:any)=>{e.currentTarget.style.display='none';}}/>}
                  <Link href={`/teams/${r.team.slug}`} style={{fontSize:15,fontWeight:700,color:'var(--text)',fontFamily:'var(--font-display)'}}>{r.team.name}</Link>
                </div>
                <Link href={`/leagues/${r.league.slug}/fixtures`} style={{fontSize:12,color:'var(--text-dim)',display:'block',marginBottom:6}}>{r.league.name}</Link>
                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  {r.appearances>0&&<span style={{fontSize:12,color:'var(--text-muted)'}}><strong style={{color:'var(--text)'}}>{r.appearances}</strong> apps</span>}
                  {r.goals>0&&<span style={{fontSize:12,color:'var(--text-muted)'}}><strong style={{color:'var(--green)'}}>{r.goals}</strong> goals</span>}
                  {r.assists>0&&<span style={{fontSize:12,color:'var(--text-muted)'}}><strong style={{color:'var(--blue-bright)'}}>{r.assists}</strong> ast</span>}
                  {r.minutesPlayed>0&&<span style={{fontSize:12,color:'var(--text-muted)'}}><strong style={{color:'var(--text)'}}>{r.minutesPlayed.toLocaleString()}</strong> mins</span>}
                  {r.yellowCards>0&&<span style={{fontSize:12,color:'var(--yellow)'}}><strong>{r.yellowCards}</strong> 🟡</span>}
                  {r.redCards>0&&<span style={{fontSize:12,color:'var(--red)'}}><strong>{r.redCards}</strong> 🟥</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchesTab({matches}:{matches:any[]}) {
  if(!matches.length) return <p style={{color:'var(--text-dim)',textAlign:'center',padding:'2rem'}}>No recent matches found.</p>;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      {matches.map((m:any,i:number)=>(
        <Link key={m.slug} href={`/matches/${m.slug}`} style={{display:'grid',gridTemplateColumns:'1fr 90px 1fr auto',alignItems:'center',gap:12,padding:'10px 0',borderBottom:i<matches.length-1?'1px solid var(--border-subtle)':'none',textDecoration:'none',transition:'background 0.1s'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,fontSize:13,color:'var(--text)',fontWeight:500,minWidth:0}}>
            {m.homeTeam.crest&&<img src={m.homeTeam.crest} alt="" width={20} height={20} style={{borderRadius:3,flexShrink:0,objectFit:'contain'}} onError={(e:any)=>{e.currentTarget.style.display='none';}}/>}
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.homeTeam.name}</span>
          </div>
          <div style={{textAlign:'center',background:'var(--bg-elevated)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',padding:'5px 8px'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,color:'var(--text)',lineHeight:1}}>{m.homeScore} – {m.awayScore}</div>
            <div style={{fontSize:10,color:'var(--text-dim)',marginTop:1}}>{new Date(m.kickoffAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:7,fontSize:13,color:'var(--text)',fontWeight:500,minWidth:0}}>
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'right'}}>{m.awayTeam.name}</span>
            {m.awayTeam.crest&&<img src={m.awayTeam.crest} alt="" width={20} height={20} style={{borderRadius:3,flexShrink:0,objectFit:'contain'}} onError={(e:any)=>{e.currentTarget.style.display='none';}}/>}
          </div>
          <div style={{display:'flex',gap:4,minWidth:60,justifyContent:'flex-end',flexWrap:'wrap'}}>
            {m.goals>0&&<span style={{fontSize:11,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'rgba(30,64,175,0.1)',color:'var(--green)'}}>⚽ {m.goals}</span>}
            {m.assists>0&&<span style={{fontSize:11,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'rgba(59,130,246,0.1)',color:'var(--blue-bright)'}}>🅰 {m.assists}</span>}
            {m.yellowCards>0&&<span style={{fontSize:11,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'var(--yellow-dim)',color:'var(--yellow)'}}>🟡</span>}
            {m.redCards>0&&<span style={{fontSize:11,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'var(--red-dim)',color:'var(--red)'}}>🟥</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}

function ProfileTab({player}:{player:any}) {
  const POS:Record<string,string>={GK:'Goalkeeper',DEF:'Defender',MID:'Midfielder',FWD:'Forward'};
  const items=[
    {l:'Full name',     v:player.name},
    {l:'Date of birth', v:player.dateOfBirth?new Date(player.dateOfBirth).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}):'—'},
    {l:'Age',           v:player.age?`${player.age} years`:'—'},
    {l:'Nationality',   v:player.nationalityCode?.toUpperCase()??'—'},
    {l:'Height',        v:player.heightCm?`${player.heightCm} cm`:'—'},
    {l:'Preferred foot',v:player.preferredFoot??'—'},
    {l:'Position',      v:POS[player.position]??player.position??'—'},
    {l:'Status',        v:player.status??'—'},
    {l:'Current club',  v:player.currentTeam?.name??'—'},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
      {items.map(({l,v})=>(
        <div key={l} style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 14px'}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--text-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:5,fontFamily:'var(--font-display)'}}>{l}</div>
          <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{v}</div>
        </div>
      ))}
    </div>
  );
}
