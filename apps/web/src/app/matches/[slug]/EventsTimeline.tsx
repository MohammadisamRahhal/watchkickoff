'use client';
import Link from 'next/link';

type Ev = {
  id: string; eventType: string; minute: number; minuteExtra?: number;
  teamId: string; playerName?: string; playerSlug?: string; assistPlayerName?: string;
};

const ICONS: Record<string,string> = {
  GOAL:'⚽', OWN_GOAL:'⚽', PENALTY_SCORED:'⚽', PENALTY_MISSED:'✖️',
  YELLOW:'🟨', SECOND_YELLOW:'🟨🟥', RED:'🟥', SUB_IN:'🔄', SUB_OUT:'🔄', VAR:'📺'
};
const LABELS: Record<string,string> = {
  GOAL:'Goal', OWN_GOAL:'Own Goal', PENALTY_SCORED:'Penalty', PENALTY_MISSED:'Pen. Missed',
  YELLOW:'Yellow Card', SECOND_YELLOW:'2nd Yellow', RED:'Red Card',
  SUB_IN:'Sub', SUB_OUT:'Sub', VAR:'VAR'
};

const S: Record<string, React.CSSProperties> = {
  wrap: { background:'var(--bg-card,#fff)', border:'1px solid var(--border,#e2e5ea)', borderRadius:'10px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' },
  header: { display:'grid', gridTemplateColumns:'1fr 56px 1fr', padding:'0.6rem 1rem', background:'var(--bg-elevated,#f0f2f5)', borderBottom:'2px solid var(--border,#e2e5ea)' },
  headerTeam: { fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted,#6b7a8d)', textTransform:'uppercase', letterSpacing:'0.05em' } as React.CSSProperties,
  period: { textAlign:'center', fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted,#6b7a8d)', padding:'0.3rem', borderTop:'1px solid var(--border,#e2e5ea)', borderBottom:'1px solid var(--border,#e2e5ea)', background:'var(--bg,#f5f6f8)' } as React.CSSProperties,
  homeSide: { display:'flex', justifyContent:'flex-end', padding:'0.4rem 0.5rem 0.4rem 1rem' },
  awaySide: { display:'flex', justifyContent:'flex-start', padding:'0.4rem 1rem 0.4rem 0.5rem' },
  timeCol: { display:'flex', justifyContent:'center', alignItems:'center' },
  minBadge: { fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', background:'var(--bg-elevated,#f0f2f5)', padding:'2px 6px', borderRadius:'4px', whiteSpace:'nowrap' } as React.CSSProperties,
  contentRight: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'1px' } as React.CSSProperties,
  contentLeft: { display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'1px' } as React.CSSProperties,
  nameRowR: { display:'flex', alignItems:'center', gap:'4px', flexDirection:'row-reverse' } as React.CSSProperties,
  nameRowL: { display:'flex', alignItems:'center', gap:'4px' } as React.CSSProperties,
  icon: { fontSize:'0.9rem', lineHeight:'1', flexShrink:0 } as React.CSSProperties,
  name: { fontSize:'0.87rem', fontWeight:600, color:'var(--text,#0f1923)', textDecoration:'none' } as React.CSSProperties,
  nameLink: { fontSize:'0.87rem', fontWeight:600, color:'var(--text,#0f1923)', textDecoration:'none', cursor:'pointer' } as React.CSSProperties,
  assist: { fontSize:'0.72rem', color:'var(--text-muted,#6b7a8d)' },
  lbl: { fontSize:'0.68rem', color:'var(--text-dim,#a0aab4)' },
};

export default function EventsTimeline({
  events, homeTeamId, homeTeamName, awayTeamName,
}: {
  events: Ev[]; homeTeamId: string; awayTeamId: string;
  homeTeamName: string; awayTeamName: string;
}) {
  if (!events?.length) return (
    <div style={{padding:'3rem',textAlign:'center',color:'var(--text-muted)',background:'var(--bg-card,#fff)',border:'1px solid var(--border,#e2e5ea)',borderRadius:'10px'}}>
      No match events available yet.
    </div>
  );

  const sorted = [...events].sort((a,b) =>
    (a.minute+(a.minuteExtra||0)/100) - (b.minute+(b.minuteExtra||0)/100)
  );
  const fh = sorted.filter(e => e.minute <= 45);
  const sh = sorted.filter(e => e.minute > 45 && e.minute <= 90);
  const et = sorted.filter(e => e.minute > 90);
  const minStr = (e: Ev) => (e.minuteExtra && e.minuteExtra > 0) ? `${e.minute}+${e.minuteExtra}'` : `${e.minute}'`;

  function PlayerName({ ev }: { ev: Ev }) {
    if (ev.playerSlug) {
      return <Link href={`/players/${ev.playerSlug}`} style={S.nameLink}>{ev.playerName || '—'}</Link>;
    }
    return <span style={S.name}>{ev.playerName || '—'}</span>;
  }

  function Row({ ev }: { ev: Ev }) {
    const isHome = ev.teamId === homeTeamId;
    const isGoal = ['GOAL','OWN_GOAL','PENALTY_SCORED'].includes(ev.eventType);
    const icon = ICONS[ev.eventType] || '•';
    const label = LABELS[ev.eventType] || ev.eventType;
    const rowStyle: React.CSSProperties = {
      display:'grid', gridTemplateColumns:'1fr 56px 1fr', alignItems:'center',
      minHeight:'44px', borderBottom:'1px solid var(--border-subtle,#eceef1)',
      background: isGoal ? 'rgba(34,197,94,0.07)' : 'transparent',
    };

    return (
      <div style={rowStyle}>
        <div style={S.homeSide}>
          {isHome && (
            <div style={S.contentRight}>
              <div style={S.nameRowR}>
                <span style={S.icon}>{icon}</span>
                <PlayerName ev={ev} />
              </div>
              {ev.assistPlayerName && <div style={S.assist}>↳ {ev.assistPlayerName}</div>}
              <div style={S.lbl}>{label}</div>
            </div>
          )}
        </div>
        <div style={S.timeCol}>
          <span style={S.minBadge}>{minStr(ev)}</span>
        </div>
        <div style={S.awaySide}>
          {!isHome && (
            <div style={S.contentLeft}>
              <div style={S.nameRowL}>
                <span style={S.icon}>{icon}</span>
                <PlayerName ev={ev} />
              </div>
              {ev.assistPlayerName && <div style={S.assist}>↳ {ev.assistPlayerName}</div>}
              <div style={S.lbl}>{label}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const Period = ({ title }: { title: string }) => <div style={S.period}>{title}</div>;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={S.headerTeam}>{homeTeamName}</span>
        <span />
        <span style={{...S.headerTeam, textAlign:'right'}}>{awayTeamName}</span>
      </div>
      {fh.length > 0 && <><Period title="1st Half" />{fh.map(ev => <Row key={ev.id} ev={ev} />)}</>}
      {sh.length > 0 && <><Period title="2nd Half" />{sh.map(ev => <Row key={ev.id} ev={ev} />)}</>}
      {et.length > 0 && <><Period title="Extra Time" />{et.map(ev => <Row key={ev.id} ev={ev} />)}</>}
    </div>
  );
}
