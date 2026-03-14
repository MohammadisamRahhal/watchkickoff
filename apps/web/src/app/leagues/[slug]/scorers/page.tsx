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
    <div className="container" style={{ paddingTop:28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season = seasonParam ?? league.season ?? '2025';

  return (
    <div className="container" style={{ paddingTop:20, paddingBottom:60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <span>{league.name}</span><span className="breadcrumb__sep">›</span>
        <span style={{color:'var(--text-muted)'}}>Top Scorers</span>
      </nav>

      <LeagueHeader league={league} activeTab="scorers" season={season} />

      {scorers.length === 0 ? <EmptyState message="No scorers data available." /> : (
        <div className="card" style={{ overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 160px 60px 60px 60px', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--text-dim)', letterSpacing:'0.06em', textTransform:'uppercase' }}>#</span>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--text-dim)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Player</span>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--text-dim)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Team</span>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--text-dim)', letterSpacing:'0.06em', textTransform:'uppercase', textAlign:'center' }}>Apps</span>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--blue-bright)', letterSpacing:'0.06em', textTransform:'uppercase', textAlign:'center' }}>Goals</span>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--text-dim)', letterSpacing:'0.06em', textTransform:'uppercase', textAlign:'center' }}>Ast</span>
          </div>

          {(scorers as any[]).map((s: any, i: number) => (
            <div key={s.playerId ?? i} style={{
              display:'grid', gridTemplateColumns:'40px 1fr 160px 60px 60px 60px',
              alignItems:'center', padding:'12px 16px',
              borderBottom:'1px solid var(--border-subtle)',
              transition:'background 0.1s',
            }}
              onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-hover)')}
              onMouseLeave={e=>(e.currentTarget.style.background='')}>

              {/* Rank */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                {i < 3 ? (
                  <span style={{
                    width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:800,
                    background: i===0?'#f59e0b': i===1?'#94a3b8': '#cd7f32',
                    color:'#fff',
                  }}>{i+1}</span>
                ) : (
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)' }}>{i+1}</span>
                )}
              </div>

              {/* Player */}
              <a href={`/players/${s.playerSlug}`} style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', color:'var(--text)', minWidth:0 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {s.playerPhoto
                    ? <img src={s.playerPhoto} alt={s.playerName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ fontSize:16 }}>👤</span>}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.playerName}</div>
                  {s.playerNationality && (
                    <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:1 }}>{s.playerNationality}</div>
                  )}
                </div>
              </a>

              {/* Team */}
              <a href={`/teams/${s.teamSlug}/fixtures`} style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', color:'var(--text-muted)', minWidth:0 }}>
                <TeamCrest url={s.teamCrest ?? null} name={s.teamName ?? ''} size={20} />
                <span style={{ fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.teamName}</span>
              </a>

              {/* Stats */}
              <div style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)' }}>{s.appearances ?? '-'}</div>
              <div style={{ textAlign:'center' }}>
                <span style={{
                  fontFamily:'var(--font-display)', fontSize:20, fontWeight:800,
                  color:'var(--text)',
                }}>{s.goals}</span>
              </div>
              <div style={{ textAlign:'center', fontSize:14, color:'var(--text-muted)', fontWeight:500 }}>{s.assists ?? '-'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
