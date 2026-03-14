'use client';
import { useState } from 'react';
import Image from 'next/image';

interface Props { scorers: any[]; slug: string; }

const TABS = [
  { id: 'goals',   label: '⚽ Goals',   key: 'goals',       min: 1 },
  { id: 'assists', label: '🅰️ Assists', key: 'assists',     min: 1 },
  { id: 'shots',   label: '🎯 Shots',   key: 'shotsTotal',  min: 1 },
  { id: 'rating',  label: '⭐ Rating',  key: 'rating',      min: 0 },
  { id: 'yellow',  label: '🟨 Yellow',  key: 'yellowCards', min: 1 },
  { id: 'red',     label: '🟥 Red',     key: 'redCards',    min: 1 },
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
      return activeTab.min === 0 ? s[activeTab.key] != null : val >= activeTab.min;
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

  const showPer90 = ['goals','assists','shots'].includes(tab);
  const colLabel = tab==='yellow'?'YC':tab==='red'?'RC':tab==='rating'?'RTG':tab==='shots'?'SHT':tab==='assists'?'AST':'G';
  const valColor = tab==='red'?'#ef4444':tab==='yellow'?'#f59e0b':tab==='rating'?'#22c55e':'var(--text)';

  return (
    <>
      {/* Tabs — scrollable */}
      <div style={{display:'flex',gap:6,marginBottom:16,overflowX:'auto',WebkitOverflowScrolling:'touch' as any,scrollbarWidth:'none' as any,paddingBottom:4}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'7px 14px', borderRadius:20, fontSize:13, fontWeight:600,
            border:'1px solid var(--border)', cursor:'pointer', whiteSpace:'nowrap' as const,
            background: tab===t.id ? '#1e40af' : 'var(--bg-card)',
            color: tab===t.id ? '#fff' : 'var(--text-muted)',
            flexShrink:0,
          }}>{t.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{textAlign:'center' as const,padding:'60px 20px',color:'var(--text-muted)'}}>
          <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>⚽</div>
          <div style={{fontSize:14}}>No data available for this stat.</div>
        </div>
      ) : (
        <div className="card" style={{overflow:'hidden'}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',padding:'9px 14px',borderBottom:'2px solid var(--border)',background:'var(--bg-elevated)',gap:8}}>
            <span style={{width:28,fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.05em',textTransform:'uppercase' as const,flexShrink:0}}>#</span>
            <span style={{flex:1,fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.05em',textTransform:'uppercase' as const}}>Player</span>
            <span style={{width:80,fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.05em',textTransform:'uppercase' as const,textAlign:'right' as const,flexShrink:0}}>Team</span>
            {showPer90 && <span style={{width:40,fontSize:11,fontWeight:700,color:'var(--text-dim)',textAlign:'right' as const,flexShrink:0}}>/90</span>}
            <span style={{width:44,fontSize:11,fontWeight:700,color:'var(--blue-bright)',textAlign:'right' as const,letterSpacing:'0.05em',textTransform:'uppercase' as const,flexShrink:0}}>{colLabel}</span>
          </div>

          {filtered.map((s:any, i:number) => (
            <div key={s.playerId??i} style={{display:'flex',alignItems:'center',padding:'11px 14px',borderBottom:'1px solid var(--border-subtle)',gap:8}}>

              {/* Rank */}
              <div style={{width:28,flexShrink:0,display:'flex',justifyContent:'center'}}>
                {i < 3
                  ? <span style={{width:22,height:22,borderRadius:'50%',background:MEDAL[i],color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800}}>{i+1}</span>
                  : <span style={{fontSize:13,fontWeight:600,color:'var(--text-muted)',textAlign:'center' as const}}>{i+1}</span>
                }
              </div>

              {/* Player name */}
              <a href={`/players/${s.playerSlug}`} style={{flex:1,textDecoration:'none',color:'var(--text)',fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,minWidth:0}}>
                {s.playerName}
              </a>

              {/* Team crest only on mobile */}
              <a href={`/teams/${s.teamSlug}/fixtures`} style={{width:80,display:'flex',alignItems:'center',gap:5,textDecoration:'none',color:'var(--text-muted)',flexShrink:0,justifyContent:'flex-end' as const,minWidth:0}}>
                <TeamCrest url={s.teamCrest??null} name={s.teamName??''} />
                <span style={{fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,maxWidth:56}}>{s.teamName?.split(' ')[0]}</span>
              </a>

              {/* /90 */}
              {showPer90 && (
                <div style={{width:40,textAlign:'right' as const,fontSize:11,color:'var(--text-dim)',fontStyle:'italic',flexShrink:0}}>{fmtPer90(s)}</div>
              )}

              {/* Stat value */}
              <div style={{width:44,textAlign:'right' as const,flexShrink:0}}>
                <span style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:800,lineHeight:1,color:valColor}}>{fmtVal(s)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
