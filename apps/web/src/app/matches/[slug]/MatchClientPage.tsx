'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import MatchHero from './MatchHero';
import EventsTimeline from './EventsTimeline';
import LineupPitch from './LineupPitch';
import MatchStats from './MatchStats';
import HeadToHead from './HeadToHead';

type Tab = 'summary' | 'lineup' | 'stats' | 'h2h';

export default function MatchClientPage({ match: initialMatch }: { match: any }) {
  const [match, setMatch] = useState(initialMatch);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const isLive = ['LIVE_1H','LIVE_2H','HALF_TIME','EXTRA_TIME','PENALTIES'].includes(match.status);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/matches/${match.slug}`);
        if (res.ok) setMatch(await res.json());
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [isLive, match.slug]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'lineup', label: 'Lineups' },
    { id: 'stats', label: 'Stats' },
    { id: 'h2h', label: 'H2H' },
  ];

  return (
    <div className="match-page">
      <div className="match-breadcrumb">
        <Link href="/">Home</Link>
        <span>›</span>
        {match.league && <><Link href={`/leagues/${match.league.slug}/fixtures`}>{match.league.name}</Link><span>›</span></>}
        <span>{match.homeTeam?.name} vs {match.awayTeam?.name}</span>
      </div>

      <MatchHero match={match} />

      <div className="match-tabs">
        {tabs.map(tab => (
          <button key={tab.id} className={`match-tab ${activeTab===tab.id?'active':''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="match-content">
        {activeTab==='summary' && <EventsTimeline events={match.events||[]} homeTeamId={match.homeTeam?.id} awayTeamId={match.awayTeam?.id} homeTeamName={match.homeTeam?.name} awayTeamName={match.awayTeam?.name} />}
        {activeTab==='lineup' && <LineupPitch lineups={match.lineups||[]} homeTeamId={match.homeTeam?.id} awayTeamId={match.awayTeam?.id} homeTeamName={match.homeTeam?.name} awayTeamName={match.awayTeam?.name} homeTeamCrest={match.homeTeam?.crestUrl} awayTeamCrest={match.awayTeam?.crestUrl} />}
        {activeTab==='stats' && <MatchStats stats={match.statistics||[]} />}
        {activeTab==='h2h' && <HeadToHead homeTeamId={match.homeTeam?.id} awayTeamId={match.awayTeam?.id} homeTeamName={match.homeTeam?.name} awayTeamName={match.awayTeam?.name} homeTeamCrest={match.homeTeam?.crestUrl} awayTeamCrest={match.awayTeam?.crestUrl} />}
      </div>

      <style jsx>{`
        .match-page { max-width: 900px; margin: 0 auto; padding: 0 1rem 3rem; }
        .match-breadcrumb { display:flex; align-items:center; gap:0.4rem; font-size:0.78rem; color:var(--text-muted); padding:0.75rem 0; }
        .match-breadcrumb a { color:var(--text-muted); text-decoration:none; transition:color 0.15s; }
        .match-breadcrumb a:hover { color:var(--text); }
        .match-tabs { display:flex; border-bottom:2px solid var(--border,#e2e5ea); margin-bottom:1.5rem; }
        .match-tab { padding:0.75rem 1.5rem; font-size:0.88rem; font-weight:600; font-family:var(--font-display,'Teko',sans-serif); letter-spacing:0.05em; text-transform:uppercase; border:none; background:none; color:var(--text-muted); cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; transition:all 0.2s; }
        .match-tab:hover { color:var(--text); background:var(--bg-hover); }
        .match-tab.active { color:var(--text); border-bottom-color:#1d4ed8; }
        .match-content { min-height:300px; }
      `}</style>
    </div>
  );
}
