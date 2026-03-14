'use client';

const NAMES: Record<string,string> = {
  'Ball Possession':'Possession','Total Shots':'Shots','Shots on Goal':'On Target',
  'Shots off Goal':'Off Target','Blocked Shots':'Blocked','Corner Kicks':'Corners',
  'Offsides':'Offsides','Fouls':'Fouls','Yellow Cards':'Yellow Cards',
  'Red Cards':'Red Cards','Goalkeeper Saves':'Saves','Total passes':'Passes',
  'Passes accurate':'Acc. Passes','Passes %':'Pass Accuracy',
};

function Row({ label, home, away }: { label: string; home: any; away: any }) {
  const h = typeof home === 'string' ? parseFloat(home)||0 : (home||0);
  const a = typeof away === 'string' ? parseFloat(away)||0 : (away||0);
  const total = h + a;
  const hp = total > 0 ? (h/total)*100 : 50;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 44px', alignItems:'center', gap:'0.75rem', padding:'0.6rem 1rem', borderBottom:'1px solid #e2e5ea' }}>
      <span style={{ fontSize:'0.9rem', fontWeight:700, color:'#0f1923', textAlign:'center' }}>{home ?? '—'}</span>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px' }}>
        <span style={{ fontSize:'0.7rem', color:'#6b7a8d', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>{label}</span>
        <div style={{ display:'flex', width:'100%', height:'6px', borderRadius:'3px', overflow:'hidden', background:'#e2e5ea' }}>
          <div style={{ background:'#1d4ed8', width:`${hp}%`, transition:'width 0.5s' }} />
          <div style={{ background:'#dc2626', width:`${100-hp}%`, transition:'width 0.5s' }} />
        </div>
      </div>
      <span style={{ fontSize:'0.9rem', fontWeight:700, color:'#0f1923', textAlign:'center' }}>{away ?? '—'}</span>
    </div>
  );
}

const ORDER = ['Ball Possession','Total Shots','Shots on Goal','Shots off Goal','Blocked Shots','Corner Kicks','Offsides','Fouls','Yellow Cards','Red Cards','Goalkeeper Saves','Total passes','Passes accurate','Passes %'];

export default function MatchStats({ stats }: { stats: any[] }) {
  if (!stats?.length) return (
    <div style={{ padding:'3rem', textAlign:'center', color:'#6b7a8d', background:'#fff', border:'1px solid #e2e5ea', borderRadius:'10px' }}>
      Match statistics not available.
    </div>
  );

  const sorted = [...stats].sort((a,b) => {
    const ai = ORDER.indexOf(a.type), bi = ORDER.indexOf(b.type);
    if (ai===-1 && bi===-1) return 0; if (ai===-1) return 1; if (bi===-1) return -1;
    return ai - bi;
  });

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e5ea', borderRadius:'10px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
      {sorted.map((s,i) => (
        <Row key={i} label={NAMES[s.type]||s.type} home={s.home} away={s.away} />
      ))}
    </div>
  );
}
