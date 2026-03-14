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

  const MEDAL = ['#f59e0b','#94a3b8','#cd7f32'];

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
          {/* Header row */}
          <div style={{display:'grid', gridTemplateColumns:'48px 1fr 160px 56px 56px 64px', padding:'9px 16px', borderBottom:'2px solid var(--border)', background:'var(--bg-elevated)', alignItems:'center'}}>
            {[['#','left'],['Player','left'],['Team','left'],['Apps','center'],['Ast','center'],['Goals','center']].map(([h,align])=>(
              <span key={h} style={{fontSize:11,fontWeight:700,color:h==='Goals'?'var(--blue-bright)':'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const,textAlign:align as any}}>{h}</span>
            ))}
          </div>

          {(scorers as any[]).map((s: any, i: number) => (
            <div key={s.playerId ?? i} style={{display:'grid', gridTemplateColumns:'48px 1fr 160px 56px 56px 64px', padding:'11px 16px', borderBottom:'1px solid var(--border-subtle)', alignItems:'center'}}>

              {/* Rank */}
              <div style={{display:'flex',justifyContent:'center'}}>
                {i < 3
                  ? <span style={{width:24,height:24,borderRadius:'50%',background:MEDAL[i],color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800}}>{i+1}</span>
                  : <span style={{fontSize:13,fontWeight:600,color:'var(--text-muted)',textAlign:'center'}}>{i+1}</span>
                }
              </div>

              {/* Player */}
              <a href={`/players/${s.playerSlug}`} style={{textDecoration:'none',color:'var(--text)',fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>
                {s.playerName}
              </a>

              {/* Team */}
              <a href={`/teams/${s.teamSlug}/fixtures`} style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none',color:'var(--text-muted)',minWidth:0}}>
                <TeamCrest url={s.teamCrest??null} name={s.teamName??''} size={20} />
                <span style={{fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{s.teamName}</span>
              </a>

              {/* Apps */}
              <div style={{textAlign:'center' as const,fontSize:13,color:'var(--text-muted)'}}>{s.appearances??'-'}</div>

              {/* Assists */}
              <div style={{textAlign:'center' as const,fontSize:13,color:'var(--text-muted)',fontWeight:500}}>{s.assists??'-'}</div>

              {/* Goals + bar */}
              <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:3}}>
                <span style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:800,color:'var(--text)',lineHeight:1}}>{s.goals}</span>
                <div style={{width:'100%',height:3,background:'var(--bg-elevated)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{width:`${(s.goals/maxGoals)*100}%`,height:'100%',background:'var(--blue-bright)',borderRadius:2}} />
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
