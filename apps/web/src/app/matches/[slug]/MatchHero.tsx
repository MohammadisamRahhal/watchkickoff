'use client';
import Link from 'next/link';

function StatusBadge({ status, minute, minuteExtra }: any) {
  const isLive = ['LIVE_1H','LIVE_2H','EXTRA_TIME','PENALTIES'].includes(status);
  if (isLive) return <span className="sb live">🔴 {minuteExtra&&minuteExtra>0?`${minute}+${minuteExtra}'`:`${minute}'`}</span>;
  if (status==='HALF_TIME') return <span className="sb ht">HT</span>;
  if (status==='FINISHED') return <span className="sb ft">FT</span>;
  if (status==='POSTPONED') return <span className="sb pp">Postponed</span>;
  if (status==='CANCELLED') return <span className="sb cc">Cancelled</span>;
  return <span className="sb up">Upcoming</span>;
}

export default function MatchHero({ match }: { match: any }) {
  const { homeTeam, awayTeam, status, minute, minuteExtra,
    homeScoreHt, awayScoreHt, kickoffAt, league, round, venue } = match;

  const homeScore = match.homeScore ?? match.score?.home ?? 0;
  const awayScore = match.awayScore ?? match.score?.away ?? 0;
  const isScheduled = ['SCHEDULED','PRE_MATCH'].includes(status);
  const isFinished = status === 'FINISHED';

  // استخرج أسماء الأهداف من الـ events
  const events = match.events || [];
  const homeGoals = events.filter((e: any) =>
    ['GOAL','PENALTY_SCORED','OWN_GOAL'].includes(e.eventType) && e.teamId === homeTeam?.id
  );
  const awayGoals = events.filter((e: any) =>
    ['GOAL','PENALTY_SCORED','OWN_GOAL'].includes(e.eventType) && e.teamId === awayTeam?.id
  );

  const kickoffDate = new Date(kickoffAt);
  const dateStr = kickoffDate.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  const timeStr = kickoffDate.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

  function Crest({ src, name }: { src?: string; name: string }) {
    const fb = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0,2))}&size=80&background=e8eaed&color=0f1923&bold=true`;
    return <img src={src||fb} alt={name} width={72} height={72} style={{objectFit:'contain'}} onError={(e:any)=>{e.target.src=fb;}} />;
  }

  function minStr(e: any) { return e.minuteExtra&&e.minuteExtra>0 ? `${e.minute}+${e.minuteExtra}'` : `${e.minute}'`; }

  return (
    <div className="mh">
      {/* League */}
      <div className="mh-meta">
        {league?.logoUrl && <img src={league.logoUrl} alt="" width={16} height={16} style={{objectFit:'contain'}} onError={(e:any)=>{e.target.style.display='none';}} />}
        {league && <Link href={`/leagues/${league.slug}/fixtures`} className="mh-league">{league.name}</Link>}
        {round && <span className="mh-round">· {round}</span>}
      </div>

      {/* Score row */}
      <div className="mh-row">
        {/* Home */}
        <div className="mh-team">
          <Link href={`/teams/${homeTeam?.slug}/fixtures`} className="mh-tlink">
            <Crest src={homeTeam?.crestUrl} name={homeTeam?.name||'Home'} />
            <span className="mh-tname">{homeTeam?.name}</span>
          </Link>
          {/* Home goals */}
          {homeGoals.length > 0 && (
            <div className="mh-goals">
              {homeGoals.map((e: any, i: number) => (
                <div key={i} className="mh-goal-item">
                  ⚽ {e.playerName} <span className="mh-goal-min">{minStr(e)}</span>
                  {e.eventType==='OWN_GOAL' && <span className="mh-og">(OG)</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center */}
        <div className="mh-center">
          <StatusBadge status={status} minute={minute} minuteExtra={minuteExtra} />
          <div className="mh-score">
            {isScheduled ? (
              <span className="mh-time">{timeStr}</span>
            ) : (
              <>
                <span className="mh-num">{homeScore}</span>
                <span className="mh-sep">–</span>
                <span className="mh-num">{awayScore}</span>
              </>
            )}
          </div>
          {isFinished && homeScoreHt!=null && <div className="mh-ht">HT {homeScoreHt} – {awayScoreHt}</div>}
          <div className="mh-date">{dateStr} · {timeStr}</div>
          {venue && <div className="mh-venue">🏟 {venue}</div>}
        </div>

        {/* Away */}
        <div className="mh-team mh-team-away">
          <Link href={`/teams/${awayTeam?.slug}/fixtures`} className="mh-tlink">
            <Crest src={awayTeam?.crestUrl} name={awayTeam?.name||'Away'} />
            <span className="mh-tname">{awayTeam?.name}</span>
          </Link>
          {/* Away goals */}
          {awayGoals.length > 0 && (
            <div className="mh-goals mh-goals-away">
              {awayGoals.map((e: any, i: number) => (
                <div key={i} className="mh-goal-item">
                  ⚽ {e.playerName} <span className="mh-goal-min">{minStr(e)}</span>
                  {e.eventType==='OWN_GOAL' && <span className="mh-og">(OG)</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .mh { background:var(--bg-card,#fff); border:1px solid var(--border,#e2e5ea); border-radius:12px; padding:1.5rem 2rem; margin-bottom:1.5rem; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .mh-meta { display:flex; align-items:center; justify-content:center; gap:0.4rem; font-size:0.78rem; color:var(--text-muted); margin-bottom:1.25rem; }
        .mh-league { color:var(--text-muted); text-decoration:none; font-weight:600; }
        .mh-league:hover { color:var(--text); }
        .mh-round { color:var(--text-muted); }
        .mh-row { display:grid; grid-template-columns:1fr auto 1fr; align-items:flex-start; gap:1rem; }
        .mh-team { display:flex; flex-direction:column; align-items:center; }
        .mh-team-away { align-items:center; }
        .mh-tlink { display:flex; flex-direction:column; align-items:center; gap:0.5rem; text-decoration:none; }
        .mh-tname { font-family:var(--font-display,'Teko',sans-serif); font-size:1.1rem; font-weight:600; color:var(--text,#0f1923); text-align:center; max-width:150px; line-height:1.2; }
        .mh-goals { margin-top:0.5rem; display:flex; flex-direction:column; gap:2px; }
        .mh-goal-item { font-size:0.72rem; color:var(--text-muted); white-space:nowrap; }
        .mh-goal-min { color:var(--text-dim,#a0aab4); }
        .mh-og { color:#dc2626; font-size:0.65rem; }
        .mh-center { display:flex; flex-direction:column; align-items:center; gap:0.35rem; min-width:160px; padding-top:0.5rem; }
        .mh-score { display:flex; align-items:center; gap:0.4rem; }
        .mh-num { font-family:var(--font-display,'Teko',sans-serif); font-size:4rem; font-weight:700; color:var(--text,#0f1923); line-height:1; min-width:48px; text-align:center; }
        .mh-sep { font-size:2.5rem; color:var(--text-muted); line-height:1; }
        .mh-time { font-family:var(--font-display,'Teko',sans-serif); font-size:2.5rem; font-weight:700; color:var(--text); }
        .mh-ht { font-size:0.73rem; color:var(--text-muted); background:var(--bg-elevated,#f0f2f5); padding:2px 10px; border-radius:4px; }
        .mh-date { font-size:0.73rem; color:var(--text-muted); }
        .mh-venue { font-size:0.7rem; color:var(--text-muted); }
        :global(.sb) { display:inline-block; font-size:0.72rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:4px; background:var(--bg-elevated); color:var(--text-muted); }
        :global(.sb.live) { background:#dc2626; color:#fff; animation:pulse 1.5s infinite; }
        :global(.sb.ht) { background:#d97706; color:#fff; }
        :global(.sb.ft) { background:var(--bg-elevated); color:var(--text-muted); }
        :global(.sb.up) { background:#1d4ed8; color:#fff; }
        :global(.sb.pp),:global(.sb.cc) { background:#6b7280; color:#fff; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
        @media(max-width:600px) { .mh{padding:1rem;} .mh-num{font-size:2.8rem;} .mh-tname{font-size:0.9rem;max-width:90px;} .mh-center{min-width:110px;} }
      `}</style>
    </div>
  );
}
