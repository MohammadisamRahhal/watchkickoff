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

  if (loading) return <div className="h2h-load">Loading...</div>;

  const fin = matches.filter(m=>['FINISHED','AWARDED'].includes(m.status));
  let hw=0,aw=0,dr=0;
  for (const m of fin) {
    const ih = m.homeTeam.id===homeTeamId;
    const hs=m.homeScore??0, as_=m.awayScore??0;
    if (hs>as_){if(ih)hw++;else aw++;}
    else if(as_>hs){if(ih)aw++;else hw++;}
    else dr++;
  }
  const total=hw+aw+dr;

  return (
    <div className="h2h">
      {/* Summary */}
      {total>0 && (
        <>
          <div className="h2h-sum">
            <div className="h2h-t">
              {homeTeamCrest && <img src={homeTeamCrest} alt="" width={24} height={24} style={{objectFit:'contain'}} onError={(e:any)=>{e.target.style.display='none';}} />}
              <span>{homeTeamName}</span>
            </div>
            <div className="h2h-rec">
              <span className="hw">{hw}</span>
              <span className="hd">{dr}</span>
              <span className="hl">{aw}</span>
            </div>
            <div className="h2h-t h2h-tr">
              <span>{awayTeamName}</span>
              {awayTeamCrest && <img src={awayTeamCrest} alt="" width={24} height={24} style={{objectFit:'contain'}} onError={(e:any)=>{e.target.style.display='none';}} />}
            </div>
          </div>
          <div className="h2h-bar">
            <div style={{background:'#1d4ed8',width:`${total?(hw/total)*100:33}%`}}/>
            <div style={{background:'#9ca3af',width:`${total?(dr/total)*100:34}%`}}/>
            <div style={{background:'#dc2626',width:`${total?(aw/total)*100:33}%`}}/>
          </div>
          <div className="h2h-bar-labels">
            <span style={{color:'#1d4ed8',fontWeight:700}}>{hw} W</span>
            <span style={{color:'#6b7280'}}>{dr} D</span>
            <span style={{color:'#dc2626',fontWeight:700}}>{aw} W</span>
          </div>
        </>
      )}

      {/* Matches list */}
      {matches.length===0 ? (
        <div className="h2h-empty">No head-to-head history found.</div>
      ) : (
        <div className="h2h-list">
          <div className="h2h-lhdr">Recent Meetings</div>
          {matches.map(m => {
            const ih = m.homeTeam.id===homeTeamId;
            const hs=m.homeScore??0, as_=m.awayScore??0;
            let res='D',rc='draw';
            if(hs!==as_){const won=ih?hs>as_:as_>hs;res=won?'W':'L';rc=won?'win':'loss';}
            const isFin=['FINISHED','AWARDED'].includes(m.status);
            return (
              <Link key={m.id} href={`/matches/${m.slug}`} className="h2h-match">
                <span className={`h2h-rb ${rc}`}>{res}</span>
                <span className="h2h-date">{new Date(m.kickoffAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
                <div className="h2h-teams">
                  <span className={`h2h-tn ${m.homeTeam.id===homeTeamId?'cur':''}`}>{m.homeTeam.name}</span>
                  <span className="h2h-sc">{isFin?`${hs} – ${as_}`:'vs'}</span>
                  <span className={`h2h-tn h2h-tn-r ${m.awayTeam.id===awayTeamId?'cur':''}`}>{m.awayTeam.name}</span>
                </div>
                {m.league && <span className="h2h-lg">{m.league.name}</span>}
              </Link>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .h2h { background:var(--bg-card,#fff); border:1px solid var(--border,#e2e5ea); border-radius:10px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.05); }
        .h2h-load { padding:3rem; text-align:center; color:var(--text-muted); }
        .h2h-sum { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; padding:1.25rem 1.5rem 0.5rem; gap:0.5rem; }
        .h2h-t { display:flex; align-items:center; gap:0.4rem; font-size:0.82rem; font-weight:700; color:var(--text); }
        .h2h-tr { justify-content:flex-end; }
        .h2h-rec { display:flex; gap:0.75rem; font-family:var(--font-display,'Teko',sans-serif); font-size:2rem; font-weight:700; justify-content:center; }
        .hw{color:#1d4ed8} .hd{color:var(--text-muted)} .hl{color:#dc2626}
        .h2h-bar { display:flex; height:6px; margin:0.5rem 1.5rem; border-radius:3px; overflow:hidden; background:var(--border); }
        .h2h-bar-labels { display:flex; justify-content:space-between; padding:0.2rem 1.5rem 0.75rem; font-size:0.72rem; }
        .h2h-lhdr { font-size:0.7rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:var(--text-muted); padding:0.5rem 1rem; border-top:1px solid var(--border); border-bottom:1px solid var(--border); background:var(--bg-elevated,#f0f2f5); }
        .h2h-match { display:grid; grid-template-columns:24px 95px 1fr auto; align-items:center; gap:0.5rem; padding:0.6rem 1rem; text-decoration:none; border-bottom:1px solid var(--border-subtle,#eceef1); transition:background 0.15s; }
        .h2h-match:last-child { border-bottom:none; }
        .h2h-match:hover { background:var(--bg-hover,#e8eaed); }
        .h2h-rb { width:22px; height:22px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:0.68rem; font-weight:800; color:#fff; flex-shrink:0; }
        .h2h-rb.win{background:#16a34a} .h2h-rb.loss{background:#dc2626} .h2h-rb.draw{background:#9ca3af}
        .h2h-date { font-size:0.73rem; color:var(--text-muted); white-space:nowrap; }
        .h2h-teams { display:flex; align-items:center; gap:0.5rem; overflow:hidden; }
        .h2h-tn { font-size:0.83rem; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
        .h2h-tn.cur { color:var(--text); font-weight:600; }
        .h2h-tn-r { text-align:right; }
        .h2h-sc { font-size:0.88rem; font-weight:700; color:var(--text); white-space:nowrap; min-width:44px; text-align:center; flex-shrink:0; }
        .h2h-lg { font-size:0.7rem; color:var(--text-muted); white-space:nowrap; }
        .h2h-empty { padding:2.5rem; text-align:center; color:var(--text-muted); font-size:0.9rem; }
      `}</style>
    </div>
  );
}
