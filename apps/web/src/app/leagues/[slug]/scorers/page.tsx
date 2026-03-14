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
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'2px solid var(--border)', background:'var(--bg-elevated)'}}>
                <th style={{padding:'10px 14px', textAlign:'left', width:40, fontSize:11, fontWeight:700, letterSpacing:'0.06em', color:'var(--text-dim)', textTransform:'uppercase' as const}}>#</th>
                <th style={{padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, letterSpacing:'0.06em', color:'var(--text-dim)', textTransform:'uppercase' as const}}>Player</th>
                <th style={{padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, letterSpacing:'0.06em', color:'var(--text-dim)', textTransform:'uppercase' as const}}>Team</th>
                <th style={{padding:'10px 14px', textAlign:'center', width:56, fontSize:11, fontWeight:700, letterSpacing:'0.06em', color:'var(--text-dim)', textTransform:'uppercase' as const}}>Apps</th>
                <th style={{padding:'10px 14px', textAlign:'center', width:56, fontSize:11, fontWeight:700, letterSpacing:'0.06em', color:'var(--text-dim)', textTransform:'uppercase' as const}}>Ast</th>
                <th style={{padding:'10px 14px', textAlign:'center', width:64, fontSize:11, fontWeight:700, letterSpacing:'0.06em', color:'var(--blue-bright)', textTransform:'uppercase' as const}}>Goals</th>
              </tr>
            </thead>
            <tbody>
              {(scorers as any[]).map((s: any, i: number) => (
                <tr key={s.playerId ?? i} style={{borderBottom:'1px solid var(--border-subtle)'}}>
                  <td style={{padding:'11px 14px'}}>
                    {i < 3
                      ? <span style={{width:24,height:24,borderRadius:'50%',background:MEDAL[i],color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800}}>{i+1}</span>
                      : <span style={{fontSize:13,fontWeight:600,color:'var(--text-muted)'}}>{i+1}</span>
                    }
                  </td>
                  <td style={{padding:'11px 14px'}}>
                    <a href={`/players/${s.playerSlug}`} style={{textDecoration:'none',color:'var(--text)',fontWeight:600,fontSize:14}}>{s.playerName}</a>
                  </td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <TeamCrest url={s.teamCrest??null} name={s.teamName??''} size={20} />
                      <a href={`/teams/${s.teamSlug}/fixtures`} style={{textDecoration:'none',color:'var(--text-muted)',fontSize:13}}>{s.teamName}</a>
                    </div>
                  </td>
                  <td style={{padding:'11px 14px',textAlign:'center',color:'var(--text-muted)',fontSize:13}}>{s.appearances??'-'}</td>
                  <td style={{padding:'11px 14px',textAlign:'center',color:'var(--text-muted)',fontSize:13}}>{s.assists??'-'}</td>
                  <td style={{padding:'11px 14px',textAlign:'center',fontWeight:800,fontSize:18,fontFamily:'var(--font-display)',color:'var(--text)'}}>{s.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
