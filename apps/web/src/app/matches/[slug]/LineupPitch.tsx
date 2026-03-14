'use client';

type Player = {
  id: string; teamId: string; playerName?: string; playerSlug?: string;
  shirtNumber?: number; positionCode?: string; formationSlot?: number;
  isStarter: boolean; isCaptain?: boolean;
};

function Dot({ p, away }: { p: Player; away: boolean }) {
  const fb = `https://ui-avatars.com/api/?name=${encodeURIComponent((p.playerName||'?').slice(0,2))}&size=36&background=${away?'dc2626':'1d4ed8'}&color=fff&bold=true`;
  const lastName = p.playerName ? p.playerName.split(' ').slice(-1)[0] : '—';
  return (
    <div className="dot">
      <div className="shirt" style={{ background: away ? '#dc2626' : '#1d4ed8' }}>
        <span>{p.shirtNumber||'?'}</span>
        {p.isCaptain && <span className="cap">C</span>}
      </div>
      <a href={`/players/${p.playerSlug}`} className="dname" style={{textDecoration:'none',color:'inherit'}}>{lastName}</a>
      <style jsx>{`
        .dot { display:flex; flex-direction:column; align-items:center; gap:3px; }
        .shirt { position:relative; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.72rem; font-weight:700; color:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.5); }
        .cap { position:absolute; top:-4px; right:-4px; background:#f59e0b; color:#000; border-radius:50%; width:13px; height:13px; font-size:0.48rem; display:flex; align-items:center; justify-content:center; font-weight:800; }
        .dname { font-size:0.6rem; font-weight:600; color:#fff; text-shadow:0 1px 3px rgba(0,0,0,0.9); max-width:55px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center; }
      `}</style>
    </div>
  );
}

function Half({ players, name, crest, away }: { players: Player[]; name: string; crest?: string; away: boolean }) {
  const starters = players.filter(p => p.isStarter).sort((a,b) => (a.formationSlot||99)-(b.formationSlot||99));
  const gk = starters.filter(p => p.positionCode==='GK' || p.formationSlot===1);
  const def = starters.filter(p => ['CB','LB','RB','LWB','RWB'].includes(p.positionCode||'') || ([2,3,4,5].includes(p.formationSlot||0) && p.positionCode!=='GK'));
  const mid = starters.filter(p => ['CM','CAM','CDM','LM','RM','DM'].includes(p.positionCode||'') || ([6,7,8,9].includes(p.formationSlot||0)));
  const fwd = starters.filter(p => ['ST','CF','LW','RW','SS'].includes(p.positionCode||'') || ([10,11].includes(p.formationSlot||0)));

  let rows: Player[][];
  if (gk.length + def.length + mid.length + fwd.length >= 9) {
    rows = [gk, def, mid, fwd].filter(r => r.length > 0);
  } else {
    const all = starters.slice(0, 11);
    rows = [[all[0]], all.slice(1,5), all.slice(5,8), all.slice(8,11)].filter(r => r.length > 0);
  }

  const displayRows = away ? [...rows].reverse() : rows;

  return (
    <div className="half">
      <div className="hlabel">
        {crest && <img src={crest} alt={name} width={18} height={18} style={{objectFit:'contain'}} onError={(e:any)=>{e.target.style.display='none'}} />}
        <span>{name}</span>
      </div>
      <div className="hrows" style={{ flexDirection: away ? 'column' : 'column-reverse' }}>
        {displayRows.map((row, i) => (
          <div key={i} className="prow">
            {row.map(p => <Dot key={p.id} p={p} away={away} />)}
          </div>
        ))}
      </div>
      <style jsx>{`
        .half { flex:1; display:flex; flex-direction:column; padding:0.5rem 0; }
        .hlabel { display:flex; align-items:center; justify-content:center; gap:0.4rem; font-size:0.75rem; font-weight:700; color:rgba(255,255,255,0.85); padding:0.35rem; margin-bottom:0.4rem; }
        .hrows { display:flex; gap:0.4rem; flex:1; justify-content:space-around; }
        .prow { display:flex; justify-content:space-around; align-items:center; }
      `}</style>
    </div>
  );
}

export default function LineupPitch({ lineups, homeTeamId, awayTeamId, homeTeamName, awayTeamName, homeTeamCrest, awayTeamCrest }: {
  lineups: Player[]; homeTeamId: string; awayTeamId: string;
  homeTeamName: string; awayTeamName: string;
  homeTeamCrest?: string; awayTeamCrest?: string;
}) {
  const home = lineups.filter(p => p.teamId === homeTeamId);
  const away = lineups.filter(p => p.teamId === awayTeamId);

  if (!lineups.length) return (
    <div className="no-lu">Lineups not available yet.
      <style jsx>{`.no-lu{padding:3rem;text-align:center;color:var(--text-muted);background:var(--card-bg);border:1px solid var(--border);border-radius:10px;}`}</style>
    </div>
  );

  const homeSubs = home.filter(p => !p.isStarter);
  const awaySubs = away.filter(p => !p.isStarter);

  return (
    <div className="lw">
      <div className="pitch">
        <div className="pitch-inner">
          <Half players={away} name={awayTeamName} crest={awayTeamCrest} away={true} />
          <div className="divider" />
          <Half players={home} name={homeTeamName} crest={homeTeamCrest} away={false} />
        </div>
      </div>

      {(homeSubs.length > 0 || awaySubs.length > 0) && (
        <div className="subs">
          {[{ players: homeSubs, name: homeTeamName, away: false }, { players: awaySubs, name: awayTeamName, away: true }].map(({ players, name, away }) =>
            players.length > 0 && (
              <div key={name} className="sub-col">
                <div className="sub-hdr">{name} — Subs</div>
                {players.map(p => (
                  <div key={p.id} className="sub-row">
                    <span className="sub-shirt" style={{ background: away ? '#dc2626' : '#1d4ed8' }}>{p.shirtNumber||'?'}</span>
                    <span className="sub-name">{p.playerName||'—'}</span>
                    <span className="sub-pos">{p.positionCode||''}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      <style jsx>{`
        .lw { display:flex; flex-direction:column; gap:1rem; }
        .pitch {
          background: linear-gradient(180deg,#166534 0%,#15803d 10%,#166534 20%,#15803d 30%,#166534 40%,#15803d 50%,#166534 60%,#15803d 70%,#166534 80%,#15803d 90%,#166534 100%);
          border-radius:10px; overflow:hidden; border:3px solid rgba(255,255,255,0.12);
          min-height:460px;
        }
        .pitch-inner { display:flex; flex-direction:column; min-height:460px; position:relative; z-index:2; }
        .divider { height:1px; background:rgba(255,255,255,0.25); margin:0 1rem; flex-shrink:0; }
        .subs { display:grid; grid-template-columns:1fr 1fr; background:var(--card-bg,#111827); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
        .sub-col { border-right:1px solid var(--border); }
        .sub-col:last-child { border-right:none; }
        .sub-hdr { font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted); padding:0.4rem 0.75rem; background:var(--bg,#0f172a); border-bottom:1px solid var(--border); }
        .sub-row { display:flex; align-items:center; gap:0.5rem; padding:0.3rem 0.75rem; border-bottom:1px solid rgba(255,255,255,0.04); }
        .sub-shirt { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700; color:#fff; flex-shrink:0; }
        .sub-name { font-size:0.8rem; font-weight:500; color:var(--text); flex:1; }
        .sub-pos { font-size:0.68rem; color:var(--text-muted); }
      `}</style>
    </div>
  );
}
