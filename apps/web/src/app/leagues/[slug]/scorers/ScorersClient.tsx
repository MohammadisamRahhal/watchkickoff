'use client';
import { useState } from 'react';
import Image from 'next/image';

interface Player {
  playerId: string; playerName: string; playerSlug: string;
  teamId?: string; teamName?: string; teamCrest?: string|null; teamSlug?: string;
  goals?: number; assists?: number; shotsTotal?: number; rating?: number;
  yellowCards?: number; redCards?: number;
  appearances?: number|null; minutesPlayed?: number|null;
}

interface Props { scorers: Player[]; yellows: Player[]; reds: Player[]; slug: string; }

const TABS = [
  { id:'goals',   label:'⚽ Goals',   key:'goals',       src:'scorers', showPer90:false  },
  { id:'assists', label:'🅰️ Assists', key:'assists',     src:'scorers', showPer90:false  },
  { id:'shots',   label:'🎯 Shots',   key:'shotsTotal',  src:'scorers', showPer90:false  },
  { id:'rating',  label:'⭐ Rating',  key:'rating',      src:'scorers', showPer90:false },
  { id:'yellow',  label:'🟨 Yellow',  key:'yellowCards', src:'yellows', showPer90:false },
  { id:'red',     label:'🟥 Red',     key:'redCards',    src:'reds',    showPer90:false },
];

const MEDAL = ['#f59e0b','#94a3b8','#cd7f32'];

function Crest({ url, name }: { url:string|null; name:string }) {
  if (!url) return <div style={{width:20,height:20,borderRadius:'50%',background:'var(--bg-elevated)',flexShrink:0}} />;
  return <div style={{width:20,height:20,position:'relative',flexShrink:0}}><Image src={url} alt={name} fill style={{objectFit:'contain'}} sizes="20px" unoptimized /></div>;
}

export default function ScorersClient({ scorers, yellows, reds, slug }: Props) {
  const [tab, setTab] = useState('goals');
  const activeTab = TABS.find(t => t.id === tab) ?? TABS[0];
  const dataMap: Record<string, Player[]> = { scorers, yellows, reds };

  const filtered = [...(dataMap[activeTab.src]??[])]
    .filter((s:any) => {
      const v = parseFloat(s[activeTab.key])||0;
      return tab==='rating' ? s[activeTab.key]!=null : v>0;
    })
    .sort((a:any,b:any)=>(parseFloat(b[activeTab.key])||0)-(parseFloat(a[activeTab.key])||0))
    .slice(0,30);

  function fmtVal(s:any): string {
    const v = s[activeTab.key];
    if (v==null) return '-';
    if (tab==='rating') return parseFloat(v).toFixed(2);
    return String(v);
  }

  function fmtPer90(s:any): string {
    const val = parseFloat(s[activeTab.key])||0;
    const mins = s.minutesPlayed||0;
    if (mins<90) return '-';
    return (val/mins*90).toFixed(2);
  }

  const colLabel = {goals:'Goals',assists:'Ast',shots:'Shots',rating:'Rating',yellow:'YC',red:'RC'}[tab]??'';
  const valColor = tab==='red'?'#ef4444':tab==='yellow'?'#f59e0b':tab==='rating'?'#22c55e':'var(--text)';
  const showPer90 = activeTab.showPer90;

  const TH: React.CSSProperties = {
    fontSize:11, fontWeight:700, color:'var(--text-dim)',
    letterSpacing:'0.06em', textTransform:'uppercase' as const,
    padding:'10px 14px',
  };

  return (
    <>
      {/* Tabs */}
      <div style={{display:'flex',gap:6,marginBottom:16,overflowX:'auto',scrollbarWidth:'none' as any,paddingBottom:2}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:600,
            border:'1px solid var(--border)', cursor:'pointer', whiteSpace:'nowrap' as const,
            background:tab===t.id?'#1e40af':'var(--bg-card)',
            color:tab===t.id?'#fff':'var(--text-muted)', flexShrink:0,
          }}>{t.label}</button>
        ))}
      </div>

      {filtered.length===0 ? (
        <div style={{textAlign:'center' as const,padding:'60px 20px',color:'var(--text-muted)'}}>
          <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>⚽</div>
          <div style={{fontSize:14}}>No data available.</div>
        </div>
      ) : (
        <div className="card" style={{overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'2px solid var(--border)',background:'var(--bg-elevated)'}}>
                <th style={{...TH,width:44,textAlign:'center' as const}}>#</th>
                <th style={{...TH,textAlign:'left' as const}}>Player</th>
                <th style={{...TH,textAlign:'left' as const}}>Team</th>
                {!['yellow','red'].includes(tab) && <th style={{...TH,textAlign:'center' as const,width:52}}>Apps</th>}
                {!['yellow','red'].includes(tab) && <th style={{...TH,textAlign:'center' as const,width:64}}>Mins</th>}
                <th style={{...TH,textAlign:'center' as const,width:64,color:'var(--blue-bright)'}}>{colLabel}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s:any,i:number)=>(
                <tr key={s.playerId??i} style={{borderBottom:'1px solid var(--border-subtle)'}}>
                  <td style={{padding:'11px 14px',textAlign:'center' as const}}>
                    {i<3
                      ?<span style={{width:24,height:24,borderRadius:'50%',background:MEDAL[i],color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800}}>{i+1}</span>
                      :<span style={{fontSize:13,fontWeight:600,color:'var(--text-muted)'}}>{i+1}</span>
                    }
                  </td>
                  <td style={{padding:'11px 14px'}}>
                    <a href={`/players/${s.playerSlug}`} style={{textDecoration:'none',color:'var(--text)',fontWeight:600,fontSize:14}}>
                      {s.playerName}
                    </a>
                  </td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <Crest url={s.teamCrest??null} name={s.teamName??''} />
                      <a href={`/teams/${s.teamSlug}`} style={{textDecoration:'none',color:'var(--text-muted)',fontSize:13}}>{s.teamName}</a>
                    </div>
                  </td>
                  {!['yellow','red'].includes(tab) && <td style={{padding:'11px 14px',textAlign:'center' as const,fontSize:13,color:'var(--text-muted)'}}>{s.appearances??'-'}</td>}
                  {!['yellow','red'].includes(tab) && <td style={{padding:'11px 14px',textAlign:'center' as const,fontSize:13,color:'var(--text-muted)'}}>{s.minutesPlayed>0?s.minutesPlayed:'-'}</td>}
                  <td style={{padding:'11px 14px',textAlign:'center' as const}}>
                    <span style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:800,color:valColor}}>{fmtVal(s)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
