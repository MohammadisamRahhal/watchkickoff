import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueScorers } from '@/lib/api';
import { ErrorBanner, EmptyState, TeamCrest } from '@/components/ui';
import LeagueHeader from '@/components/LeagueHeader';

export const revalidate = 3600;
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string; tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const l = await getLeagueBySlug(slug);
    const yr = Number(l.season ?? 2025);
    return { title: `${l.name} ${yr}/${yr+1} Stats · WatchKickoff` };
  } catch { return { title: 'Stats · WatchKickoff' }; }
}

const TABS = [
  { id: 'goals',   label: 'Goals',   key: 'goals' },
  { id: 'assists', label: 'Assists', key: 'assists' },
  { id: 'shots',   label: 'Shots',   key: 'shotsTotal' },
  { id: 'rating',  label: 'Rating',  key: 'rating' },
  { id: 'cards',   label: 'Cards 🟨', key: 'yellowCards' },
];

const MEDAL = ['#f59e0b','#94a3b8','#cd7f32'];

export default async function ScorersPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { season: seasonParam, tab = 'goals' } = await searchParams;

  const [leagueRes, scorersRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueScorers(slug),
  ]);

  const league  = leagueRes.status  === 'fulfilled' ? leagueRes.value  : null;
  const allScorers = scorersRes.status === 'fulfilled' ? scorersRes.value as any[] : [];

  if (!league) return (
    <div className="container" style={{paddingTop:28}}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season = seasonParam ?? league.season ?? '2025';
  const activeTab = TABS.find(t => t.id === tab) ?? TABS[0];

  // Sort by active tab
  const scorers = [...allScorers].filter((s:any) => {
    const val = s[activeTab.key];
    return val != null && val > 0;
  }).sort((a:any, b:any) => {
    const av = parseFloat(a[activeTab.key]) || 0;
    const bv = parseFloat(b[activeTab.key]) || 0;
    return bv - av;
  }).slice(0, 30);

  const TAB_BTN = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
    textDecoration: 'none', border: '1px solid var(--border)',
    background: active ? '#1e40af' : 'var(--bg-card)',
    color: active ? '#fff' : 'var(--text-muted)',
    whiteSpace: 'nowrap' as const, flexShrink: 0,
  });

  function formatValue(s: any): string {
    const val = s[activeTab.key];
    if (val == null) return '-';
    if (activeTab.id === 'rating') return parseFloat(val).toFixed(2);
    return String(val);
  }

  const colLabel = activeTab.label.replace(' 🟨','');

  return (
    <div className="container" style={{paddingTop:20, paddingBottom:60}}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <span>{league.name}</span><span className="breadcrumb__sep">›</span>
        <span style={{color:'var(--text-muted)'}}>Stats</span>
      </nav>

      <LeagueHeader league={league} activeTab="scorers" season={season} />

      {/* Tabs */}
      <div style={{display:'flex', gap:6, marginBottom:16, overflowX:'auto', scrollbarWidth:'none', paddingBottom:2}}>
        {TABS.map(t => (
          <a key={t.id} href={`/leagues/${slug}/scorers?tab=${t.id}`} style={TAB_BTN(tab===t.id)}>{t.label}</a>
        ))}
      </div>

      {scorers.length === 0 ? <EmptyState message="No data available." /> : (
        <div className="card" style={{overflow:'hidden'}}>
          {/* Header */}
          <div style={{display:'grid', gridTemplateColumns:'48px 1fr 160px 60px 60px 72px', padding:'10px 16px', borderBottom:'2px solid var(--border)', background:'var(--bg-elevated)', alignItems:'center'}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const}}>#</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const}}>Player</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const}}>Team</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const,textAlign:'center' as const}}>Apps</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'0.06em',textTransform:'uppercase' as const,textAlign:'center' as const}}>Mins</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--blue-bright)',letterSpacing:'0.06em',textTransform:'uppercase' as const,textAlign:'center' as const}}>{colLabel}</span>
          </div>

          {scorers.map((s: any, i: number) => (
            <div key={s.playerId ?? i} style={{display:'grid', gridTemplateColumns:'48px 1fr 160px 60px 60px 72px', padding:'11px 16px', borderBottom:'1px solid var(--border-subtle)', alignItems:'center'}}>

              {/* Rank */}
              <div style={{display:'flex',justifyContent:'center'}}>
                {i < 3
                  ? <span style={{width:24,height:24,borderRadius:'50%',background:MEDAL[i],color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800}}>{i+1}</span>
                  : <span style={{fontSize:13,fontWeight:600,color:'var(--text-muted)',textAlign:'center' as const,width:24,display:'inline-block'}}>{i+1}</span>
                }
              </div>

              {/* Player */}
              <a href={`/players/${s.playerSlug}`} style={{textDecoration:'none',color:'var(--text)',fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>
                {s.playerName}
              </a>

              {/* Team */}
              <a href={`/teams/${s.teamSlug}/fixtures`} style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none',color:'var(--text-muted)',minWidth:0}}>
                <TeamCrest url={s.teamCrest??null} name={s.teamName??''} size={20} />
                <span style={{fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{s.teamName}</span>
              </a>

              {/* Apps */}
              <div style={{textAlign:'center' as const,fontSize:13,color:'var(--text-muted)'}}>{s.appearances??'-'}</div>

              {/* Mins */}
              <div style={{textAlign:'center' as const,fontSize:12,color:'var(--text-muted)'}}>{s.minutesPlayed > 0 ? s.minutesPlayed : '-'}</div>

              {/* Stat value */}
              <div style={{textAlign:'center' as const}}>
                <span style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:800,color:'var(--text)',lineHeight:1}}>
                  {formatValue(s)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
