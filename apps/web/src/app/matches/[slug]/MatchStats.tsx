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
    <div className="sr">
      <span className="sv">{home??'—'}</span>
      <div className="sc">
        <span className="sl">{label}</span>
        <div className="sb"><div className="sbh" style={{width:`${hp}%`}}/><div className="sba" style={{width:`${100-hp}%`}}/></div>
      </div>
      <span className="sv">{away??'—'}</span>
      <style jsx>{`
        .sr { display:grid; grid-template-columns:44px 1fr 44px; align-items:center; gap:0.75rem; padding:0.55rem 1rem; border-bottom:1px solid var(--border,#1f2937); }
        .sr:last-child { border-bottom:none; }
        .sv { font-size:0.88rem; font-weight:700; color:var(--text); text-align:center; }
        .sc { display:flex; flex-direction:column; align-items:center; gap:4px; }
        .sl { font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; font-weight:600; }
        .sb { display:flex; width:100%; height:5px; border-radius:3px; overflow:hidden; background:var(--border); }
        .sbh { background:#1d4ed8; }
        .sba { background:#dc2626; }
      `}</style>
    </div>
  );
}

export default function MatchStats({ stats }: { stats: any[] }) {
  if (!stats?.length) return (
    <div className="se">Match statistics not available.
      <style jsx>{`.se{padding:3rem;text-align:center;color:var(--text-muted);background:var(--card-bg);border:1px solid var(--border);border-radius:10px;}`}</style>
    </div>
  );

  const order = ['Ball Possession','Total Shots','Shots on Goal','Shots off Goal','Blocked Shots','Corner Kicks','Offsides','Fouls','Yellow Cards','Red Cards','Goalkeeper Saves','Total passes','Passes accurate','Passes %'];
  const sorted = [...stats].sort((a,b) => {
    const ai = order.indexOf(a.type), bi = order.indexOf(b.type);
    if (ai===-1 && bi===-1) return 0; if (ai===-1) return 1; if (bi===-1) return -1;
    return ai - bi;
  });

  return (
    <div style={{background:'var(--card-bg,#111827)',border:'1px solid var(--border,#1f2937)',borderRadius:'10px',overflow:'hidden'}}>
      {sorted.map((s,i) => <Row key={i} label={NAMES[s.type]||s.type} home={s.home} away={s.away} />)}
    </div>
  );
}
