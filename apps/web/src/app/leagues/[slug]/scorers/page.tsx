import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueScorers } from '@/lib/api';
import { ErrorBanner, EmptyState, TeamCrest } from '@/components/ui';
import LeagueHeader from '@/components/LeagueHeader';

export const revalidate = 3600;
interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ season?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const l = await getLeagueBySlug(slug);
    const yr = Number(l.season ?? 2025);
    return { title: `${l.name} ${yr}/${yr+1} Top Scorers · WatchKickoff` };
  } catch { return { title: 'Top Scorers · WatchKickoff' }; }
}

function RankBadge({rank}: {rank: number}) {
  const gold   = {background:'#f59e0b',color:'#fff'};
  const silver = {background:'#94a3b8',color:'#fff'};
  const bronze = {background:'#cd7f32',color:'#fff'};
  const style = rank===1?gold:rank===2?silver:rank===3?bronze:{background:'var(--bg-elevated)',color:'var(--text-muted)'};
  return (
    <span style={{width:26,height:26,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0,...style}}>
      {rank}
    </span>
  );
}

function GoalBar({goals, max}: {goals: number; max: number}) {
  const pct = max > 0 ? (goals / max) * 100 : 0;
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,width:'100%'}}>
      <div style={{flex:1,height:4,background:'var(--bg-elevated)',borderRadius:2,overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background:'var(--blue-bright)',borderRadius:2,transition:'width 0.3s'}} />
      </div>
      <span style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:800,color:'var(--text)',minWidth:32,textAlign:'right',lineHeight:1}}>
        {goals}
      </span>
    </div>
  );
}

export default async function ScorersPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { season: seasonParam } = await searchParams;

  const [leagueRes, scorersRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueScorers(slug),
  ]);

  const league  = leagueRes.status  === 'fulfilled' ? leagueRes.value  : null;
  const scorers = scorersRes.status === 'fulfilled' ? scorersRes.value as any[] : [];

  if (!league) return (
    <div className="container" style={{paddingTop:28}}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season = seasonParam ?? league.season ?? '2025';
  const maxGoals = scorers.length > 0 ? Math.max(...(scorers as any[]).map((s:any) => s.goals ?? 0)) : 1;

  return (
    <div className="container" style={{paddingTop:20, paddingBottom:60}}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <span>{league.name}</span><span className="breadcrumb__sep">›</span>
        <span style={{color:'var(--text-muted)'}}>Top Scorers</span>
      </nav>

      <LeagueHeader league={league} activeTab="scorers" season={season} />

      {scorers.length === 0 ? <EmptyState message="No scorers data available." /> : (
        <div className="card" style={{overflow:'hidden'}}>
          {/* Header */}
          <div style={{display:'grid', gridTemplateColumns:'44px 1fr 180px 60px 60px', alignItems:'center', padding:'10px 16px', borderBottom:'2px solid var(--border)', background:'var(--bg-elevated)'}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const}}>#</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const}}>Player</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const}}>Team</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const, textAlign:'center' as const}}>Apps</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const, textAlign:'center' as const}}>Ast</span>
          </div>

          {(scorers as any[]).map((s: any, i: number) => (
            <div key={s.playerId ?? i} style={{
              display:'grid', gridTemplateColumns:'44px 1fr 180px 60px 60px',
              alignItems:'center', padding:'14px 16px',
              borderBottom:'1px solid var(--border-subtle)',
              background: i < 3 ? `rgba(${i===0?'245,158,11':i===1?'148,163,184':'205,127,50'},0.04)` : undefined,
            }}>
              {/* Rank */}
              <div style={{display:'flex',justifyContent:'center'}}>
                <RankBadge rank={i+1} />
              </div>

              {/* Player + goal bar */}
              <div style={{display:'flex',flexDirection:'column' as const, gap:6, paddingRight:16, minWidth:0}}>
                <a href={`/players/${s.playerSlug}`} style={{fontWeight:700,fontSize:14,color:'var(--text)',textDecoration:'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>
                  {s.playerName}
                </a>
                <GoalBar goals={s.goals} max={maxGoals} />
              </div>

              {/* Team */}
              <a href={`/teams/${s.teamSlug}/fixtures`} style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none',color:'var(--text-muted)',minWidth:0}}>
                <TeamCrest url={s.teamCrest??null} name={s.teamName??''} size={20} />
                <span style={{fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{s.teamName}</span>
              </a>

              {/* Apps */}
              <div style={{textAlign:'center' as const,fontSize:13,color:'var(--text-muted)'}}>{s.appearances??'-'}</div>

              {/* Assists */}
              <div style={{textAlign:'center' as const,fontSize:14,fontWeight:600,color:'var(--text-muted)'}}>{s.assists??'-'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
