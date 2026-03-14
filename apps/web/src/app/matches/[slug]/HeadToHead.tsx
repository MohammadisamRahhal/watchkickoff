'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HeadToHead({ homeTeamId, awayTeamId, homeTeamName, awayTeamName, homeTeamCrest, awayTeamCrest }: {
  homeTeamId: string; awayTeamId: string; homeTeamName: string; awayTeamName: string;
  homeTeamCrest?: string; awayTeamCrest?: string;
}) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!homeTeamId || !awayTeamId) return;
    fetch(`/api/v1/matches/h2h?homeTeamId=${homeTeamId}&awayTeamId=${awayTeamId}&limit=10`)
      .then(r => r.json()).then(d => setMatches(Array.isArray(d)?d:d.matches||[]))
      .catch(()=>setMatches([])).finally(()=>setLoading(false));
  }, [homeTeamId, awayTeamId]);

  if (loading) return (
    <div style={{padding:'2rem',textAlign:'center',color:'#6b7a8d',background:'#fff',border:'1px solid #e2e5ea',borderRadius:'10px'}}>
      Loading...
    </div>
  );

  const fin = matches.filter(m=>['FINISHED','AWARDED'].includes(m.status));
  let hw=0,aw=0,dr=0;
  for (const m of fin) {
    const ih=m.homeTeam.id===homeTeamId, hs=m.homeScore??0, as_=m.awayScore??0;
    if(hs>as_){if(ih)hw++;else aw++;}
    else if(as_>hs){if(ih)aw++;else hw++;}
    else dr++;
  }
  const total=hw+aw+dr;

  return (
    <div style={{background:'#fff',border:'1px solid #e2e5ea',borderRadius:'10px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
      {/* Summary */}
      {total > 0 && (
        <div style={{padding:'1.25rem 1.5rem 0',background:'#fff'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
              {homeTeamCrest && <img src={homeTeamCrest} alt="" width={24} height={24} style={{objectFit:'contain'}} onError={(e:any)=>{e.target.style.display='none';}} />}
              <span style={{fontSize:'0.82rem',fontWeight:700,color:'#0f1923'}}>{homeTeamName}</span>
            </div>
            <div style={{display:'flex',gap:'0.75rem',fontFamily:'var(--font-display,"Teko",sans-serif)',fontSize:'2rem',fontWeight:700}}>
              <span style={{color:'#1d4ed8'}}>{hw}</span>
              <span style={{color:'#9ca3af'}}>{dr}</span>
              <span style={{color:'#dc2626'}}>{aw}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'0.4rem'}}>
              <span style={{fontSize:'0.82rem',fontWeight:700,color:'#0f1923'}}>{awayTeamName}</span>
              {awayTeamCrest && <img src={awayTeamCrest} alt="" width={24} height={24} style={{objectFit:'contain'}} onError={(e:any)=>{e.target.style.display='none';}} />}
            </div>
          </div>
          <div style={{display:'flex',height:'6px',borderRadius:'3px',overflow:'hidden',marginBottom:'0.4rem'}}>
            <div style={{background:'#1d4ed8',width:`${total?(hw/total)*100:33}%`}} />
            <div style={{background:'#9ca3af',width:`${total?(dr/total)*100:34}%`}} />
            <div style={{background:'#dc2626',width:`${total?(aw/total)*100:33}%`}} />
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.72rem',paddingBottom:'0.75rem'}}>
            <span style={{color:'#1d4ed8',fontWeight:700}}>{hw} W</span>
            <span style={{color:'#9ca3af'}}>{dr} D</span>
            <span style={{color:'#dc2626',fontWeight:700}}>{aw} W</span>
          </div>
        </div>
      )}

      {/* Matches */}
      {matches.length === 0 ? (
        <div style={{padding:'2.5rem',textAlign:'center',color:'#6b7a8d'}}>No head-to-head history found.</div>
      ) : (
        <>
          <div style={{fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:'#6b7a8d',padding:'0.5rem 1rem',borderTop:'1px solid #e2e5ea',borderBottom:'1px solid #e2e5ea',background:'#f0f2f5'}}>
            Recent Meetings
          </div>
          {matches.map(m => {
            const ih=m.homeTeam.id===homeTeamId, hs=m.homeScore??0, as_=m.awayScore??0;
            let res='D',rc='#9ca3af';
            if(hs!==as_){const won=ih?hs>as_:as_>hs;res=won?'W':'L';rc=won?'#16a34a':'#dc2626';}
            const isFin=['FINISHED','AWARDED'].includes(m.status);
            return (
              <Link key={m.id} href={`/matches/${m.slug}`} style={{display:'grid',gridTemplateColumns:'24px 90px 1fr auto',alignItems:'center',gap:'0.5rem',padding:'0.55rem 1rem',textDecoration:'none',borderBottom:'1px solid #eceef1',background:'#fff'}}>
                <span style={{width:'22px',height:'22px',borderRadius:'4px',background:rc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.68rem',fontWeight:800,color:'#fff',flexShrink:0}}>
                  {res}
                </span>
                <span style={{fontSize:'0.73rem',color:'#6b7a8d',whiteSpace:'nowrap'}}>
                  {new Date(m.kickoffAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                </span>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',overflow:'hidden'}}>
                  <span style={{fontSize:'0.83rem',color:m.homeTeam.id===homeTeamId?'#0f1923':'#6b7a8d',fontWeight:m.homeTeam.id===homeTeamId?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
                    {m.homeTeam.name}
                  </span>
                  <span style={{fontSize:'0.88rem',fontWeight:700,color:'#0f1923',whiteSpace:'nowrap',minWidth:'44px',textAlign:'center'}}>
                    {isFin?`${hs} – ${as_}`:'vs'}
                  </span>
                  <span style={{fontSize:'0.83rem',color:m.awayTeam.id===awayTeamId?'#0f1923':'#6b7a8d',fontWeight:m.awayTeam.id===awayTeamId?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,textAlign:'right'}}>
                    {m.awayTeam.name}
                  </span>
                </div>
                {m.league && <span style={{fontSize:'0.7rem',color:'#6b7a8d',whiteSpace:'nowrap'}}>{m.league.name}</span>}
              </Link>
            );
          })}
        </>
      )}
    </div>
  );
}
