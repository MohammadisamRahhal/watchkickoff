'use client';

type Ev = { id: string; eventType: string; minute: number; minuteExtra?: number; teamId: string; playerName?: string; assistPlayerName?: string; };

const ICONS: Record<string,string> = { GOAL:'⚽', OWN_GOAL:'⚽', PENALTY_SCORED:'⚽', PENALTY_MISSED:'✖️', YELLOW:'🟨', SECOND_YELLOW:'🟨🟥', RED:'🟥', SUB_IN:'🔄', SUB_OUT:'🔄', VAR:'📺' };
const LABELS: Record<string,string> = { GOAL:'Goal', OWN_GOAL:'Own Goal', PENALTY_SCORED:'Penalty', PENALTY_MISSED:'Pen. Missed', YELLOW:'Yellow Card', SECOND_YELLOW:'2nd Yellow', RED:'Red Card', SUB_IN:'Substitution', SUB_OUT:'Substitution', VAR:'VAR' };

export default function EventsTimeline({ events, homeTeamId, homeTeamName, awayTeamName }: {
  events: Ev[]; homeTeamId: string; awayTeamId: string; homeTeamName: string; awayTeamName: string;
}) {
  if (!events?.length) return (
    <div style={{padding:'3rem',textAlign:'center',color:'var(--text-muted)',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'10px'}}>
      No match events available yet.
    </div>
  );

  const sorted = [...events].sort((a,b) => (a.minute+(a.minuteExtra||0)/100)-(b.minute+(b.minuteExtra||0)/100));
  const fh = sorted.filter(e => e.minute <= 45);
  const sh = sorted.filter(e => e.minute > 45 && e.minute <= 90);
  const et = sorted.filter(e => e.minute > 90);
  const minStr = (e: Ev) => (e.minuteExtra && e.minuteExtra > 0) ? `${e.minute}+${e.minuteExtra}'` : `${e.minute}'`;

  function Row({ ev }: { ev: Ev }) {
    const isHome = ev.teamId === homeTeamId;
    const isGoal = ['GOAL','OWN_GOAL','PENALTY_SCORED'].includes(ev.eventType);
    const icon = ICONS[ev.eventType] || '•';
    const label = LABELS[ev.eventType] || ev.eventType;

    return (
      <div className={`ev ${isGoal ? 'ev-goal' : ''}`}>
        {/* Home side */}
        <div className="ev-home-side">
          {isHome && (
            <>
              <div className="ev-content ev-content-right">
                <div className="ev-name-row">
                  <span className="ev-name">{ev.playerName || '—'}</span>
                  <span className="ev-ico">{icon}</span>
                </div>
                {ev.assistPlayerName && <div className="ev-ast">↳ {ev.assistPlayerName}</div>}
                <div className="ev-lbl">{label}</div>
              </div>
            </>
          )}
        </div>
        {/* Minute center */}
        <div className="ev-time">
          <span className="ev-min">{minStr(ev)}</span>
        </div>
        {/* Away side */}
        <div className="ev-away-side">
          {!isHome && (
            <>
              <div className="ev-content ev-content-left">
                <div className="ev-name-row">
                  <span className="ev-ico">{icon}</span>
                  <span className="ev-name">{ev.playerName || '—'}</span>
                </div>
                {ev.assistPlayerName && <div className="ev-ast">↳ {ev.assistPlayerName}</div>}
                <div className="ev-lbl">{label}</div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tl">
      {/* Header */}
      <div className="tl-header">
        <span className="tl-team">{homeTeamName}</span>
        <span className="tl-mid-hdr"></span>
        <span className="tl-team tl-team-right">{awayTeamName}</span>
      </div>

      {fh.length > 0 && <><div className="period">1st Half</div>{fh.map(ev => <Row key={ev.id} ev={ev} />)}</>}
      {sh.length > 0 && <><div className="period">2nd Half</div>{sh.map(ev => <Row key={ev.id} ev={ev} />)}</>}
      {et.length > 0 && <><div className="period">Extra Time</div>{et.map(ev => <Row key={ev.id} ev={ev} />)}</>}

      <style jsx>{`
        .tl { background:var(--bg-card,#fff); border:1px solid var(--border,#e2e5ea); border-radius:10px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.05); }

        .tl-header { display:grid; grid-template-columns:1fr 56px 1fr; padding:0.6rem 1rem; background:var(--bg-elevated,#f0f2f5); border-bottom:2px solid var(--border); }
        .tl-team { font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }
        .tl-team-right { text-align:right; }
        .tl-mid-hdr { text-align:center; }

        .period { text-align:center; font-size:0.68rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-muted); padding:0.3rem; border-top:1px solid var(--border); border-bottom:1px solid var(--border); background:var(--bg,#f5f6f8); }

        .ev { display:grid; grid-template-columns:1fr 56px 1fr; align-items:center; min-height:44px; border-bottom:1px solid var(--border-subtle,#eceef1); transition:background 0.15s; }
        .ev:last-child { border-bottom:none; }
        .ev:hover { background:var(--bg-hover,#e8eaed); }
        .ev-goal { background:rgba(34,197,94,0.07); }
        .ev-goal:hover { background:rgba(34,197,94,0.11); }

        .ev-home-side { display:flex; justify-content:flex-end; padding:0.4rem 0.5rem 0.4rem 1rem; }
        .ev-away-side { display:flex; justify-content:flex-start; padding:0.4rem 1rem 0.4rem 0.5rem; }
        .ev-time { display:flex; justify-content:center; align-items:center; }
        .ev-min { font-size:0.7rem; font-weight:700; color:var(--text-muted); background:var(--bg-elevated,#f0f2f5); padding:2px 6px; border-radius:4px; white-space:nowrap; }

        .ev-content { display:flex; flex-direction:column; gap:1px; }
        .ev-content-right { align-items:flex-end; text-align:right; }
        .ev-content-left { align-items:flex-start; text-align:left; }

        .ev-name-row { display:flex; align-items:center; gap:4px; }
        .ev-ico { font-size:0.9rem; line-height:1; flex-shrink:0; }
        .ev-name { font-size:0.87rem; font-weight:600; color:var(--text,#0f1923); }
        .ev-ast { font-size:0.72rem; color:var(--text-muted); }
        .ev-lbl { font-size:0.68rem; color:var(--text-dim,#a0aab4); }
      `}</style>
    </div>
  );
}
