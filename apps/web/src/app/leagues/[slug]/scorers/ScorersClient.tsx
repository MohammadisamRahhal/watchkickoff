'use client';
import { useState } from 'react';
import Image from 'next/image';

interface Props { scorers: any[]; slug: string; }

const TABS = [
  { id: 'goals',    label: '⚽ Goals',    key: 'goals',       min: 1 },
  { id: 'assists',  label: '🅰️ Assists',  key: 'assists',     min: 1 },
  { id: 'shots',    label: '🎯 Shots',    key: 'shotsTotal',  min: 1 },
  { id: 'rating',   label: '⭐ Rating',   key: 'rating',      min: 0 },
  { id: 'yellow',   label: '🟨 Yellow',   key: 'yellowCards', min: 1 },
  { id: 'red',      label: '🟥 Red',      key: 'redCards',    min: 1 },
];

const MEDAL = ['#f59e0b','#94a3b8','#cd7f32'];

function TeamCrest({ url, name }: { url: string|null; name: string }) {
  if (!url) return <div style={{width:20,height:20,borderRadius:'50%',background:'var(--bg-elevated)',flexShrink:0}} />;
  return (
    <div style={{width:20,height:20,position:'relative',flexShrink:0}}>
      <Image src={url} alt={name} fill style={{objectFit:'contain'}} sizes="20px" unoptimized />
    </div>
  );
}

export default function ScorersClient({ scorers, slug }: Props) {
  const [tab, setTab] = useState('goals');
  const activeTab = TABS.find(t => t.id === tab) ?? TABS[0];

  const filtered = scorers
    .filter((s:any) => {
      const val = parseFloat(s[activeTab.key]) || 0;
      return val > activeTab.min || (activeTab.min === 0 && s[activeTab.key] != null);
    })
    .sort((a:any, b:any) => (parseFloat(b[activeTab.key])||0) - (parseFloat(a[activeTab.key])||0))
    .slice(0, 30);

  function fmtVal(s: any): string {
    const v = s[activeTab.key];
    if (v == null) return '-';
    if (tab === 'rating') return parseFloat(v).toFixed(2);
    return String(v);
  }

  function fmtPer90(s: any): string {
    if (!['goals','assists','shots'].includes(tab)) return '';
    const val = parseFloat(s[activeTab.key]) || 0;
    const mins = s.minutesPlayed || 0;
    if (mins < 90) return '-';
    return (val / mins * 90).toFixed(2);
  }

  const colLabel = tab === 'yellow' ? 'Yellow' : tab === 'red' ? 'Red' :
    tab === 'rating' ? 'Rating' : activeTab.label.split(' ')[1];

  const showPer90 = ['goals','assists','shots'].includes(tab);

  return (
    <>
      {/* Tabs */}
      <div style={{display:'flex',gap:6,marginBottom:16,overflowX:'auto',scrollbarWidth:'none' as any,paddingBottom:2}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:600,
            border:'1px solid var(--border)', cursor:'pointer', whiteSpace:'nowrap',
            background: tab===t.id ? '#1e40af' : 'var(--bg-card)',
            color: tab===t.id ? '#fff' : 'var(--text-muted)',
            flexShrink:0, transition:'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 20px',color:'var(--text-muted)'}}>
          <div style={{fontSize:40,opacity:0.3,marginBottom:12}}>⚽</div>
          <div>No data available for this stat.</div>
        </div>
      ) : (
        <div className="card" style={{overflow:'hidden'}}>
          {/* Header */}
          <div style={{display:'grid',gridTemplateColumns:`48px 1fr 150px 56px 56px${showPer90?' 72px':''} 72px`,padding:'10px 16px',borderBottom:'2px solid var(--border)',background:'var(--bg-elevated)',alignItems:'center',gap:0}}>
            {['#','Player','Team','Apps','Mins',...(showPer90?['/90']:[]),colLabel].map((h,i)=>(
              <span key={i} style={{fontSize:11,fontWeight:700,color:i===5+Number(showPer90)||(!showPer90&&i===5)?'var(--blue-bright)':'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const,textAlign:i<2?'left' as const:'center' as const}}>{h}</span>
            ))}
          </div>

          {filtered.map((s:any, i:number) => (
            <div key={s.playerId??i} style={{display:'grid',gridTemplateColumns:`48px 1fr 150px 56px 56px${showPer90?' 72px':''} 72px`,padding:'11px 16px',borderBottom:'1px solid var(--border-subtle)',alignItems:'center',gap:0}}>

              <div style={{display:'flex',justifyContent:'center'}}>
                {i<3
                  ? <span style={{width:24,height:24,borderRadius:'50%',background:MEDAL[i],color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800}}>{i+1}</span>
                  : <span style={{fontSize:13,fontWeight:600,color:'var(--text-muted)',textAlign:'center' as const,width:24,display:'inline-block'}}>{i+1}</span>
                }
              </div>

              <a href={`/players/${s.playerSlug}`} style={{textDecoration:'none',color:'var(--text)',fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>
                {s.playerName}
              </a>

              <a href={`/teams/${s.teamSlug}/fixtures`} style={{display:'flex',alignItems:'center',gap:6,textDecoration:'none',color:'var(--text-muted)',minWidth:0}}>
                <TeamCrest url={s.teamCrest??null} name={s.teamName??''} />
                <span style={{fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{s.teamName}</span>
              </a>

              <div style={{textAlign:'center' as const,fontSize:13,color:'var(--text-muted)'}}>{s.appearances??'-'}</div>
              <div style={{textAlign:'center' as const,fontSize:12,color:'var(--text-muted)'}}>{s.minutesPlayed>0?s.minutesPlayed:'-'}</div>

              {showPer90 && (
                <div style={{textAlign:'center' as const,fontSize:12,color:'var(--text-muted)',fontStyle:'italic'}}>{fmtPer90(s)}</div>
              )}

              <div style={{textAlign:'center' as const}}>
                <span style={{
                  fontFamily:'var(--font-display)',fontSize:20,fontWeight:800,lineHeight:1,
                  color: tab==='red'?'#ef4444':tab==='yellow'?'#f59e0b':tab==='rating'?'var(--green)':'var(--text)',
                }}>{fmtVal(s)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
