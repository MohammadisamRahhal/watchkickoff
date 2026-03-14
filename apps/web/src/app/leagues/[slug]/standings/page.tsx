import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueMatches, getStandings } from '@/lib/api';
import { TeamCrest, ErrorBanner, EmptyState } from '@/components/ui';
import LeagueHeader from '@/components/LeagueHeader';

export const revalidate = 300;
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; season?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const l = await getLeagueBySlug(slug);
    const yr = Number(l.season ?? 2025);
    return { title: `${l.name} ${yr}/${yr+1} Standings` };
  } catch { return { title: 'Standings' }; }
}

function calcSplit(matches: any[], standings: any[]) {
  const home: Record<string,any> = {};
  const away: Record<string,any> = {};
  for (const s of standings) {
    home[s.teamId] = {w:0,d:0,l:0,gf:0,ga:0,pts:0,played:0};
    away[s.teamId] = {w:0,d:0,l:0,gf:0,ga:0,pts:0,played:0};
  }
  for (const m of matches) {
    if (!['FINISHED','AWARDED'].includes(m.status)) continue;
    const hid = m.homeTeamId, aid = m.awayTeamId;
    const hs = m.homeScore ?? 0, as_ = m.awayScore ?? 0;
    if (home[hid]) {
      home[hid].gf+=hs; home[hid].ga+=as_; home[hid].played++;
      if(hs>as_){home[hid].w++;home[hid].pts+=3;}
      else if(hs===as_){home[hid].d++;home[hid].pts++;}
      else home[hid].l++;
    }
    if (away[aid]) {
      away[aid].gf+=as_; away[aid].ga+=hs; away[aid].played++;
      if(as_>hs){away[aid].w++;away[aid].pts+=3;}
      else if(as_===hs){away[aid].d++;away[aid].pts++;}
      else away[aid].l++;
    }
  }
  return {home,away};
}

function FormDot({result}: {result: string}) {
  const colors: Record<string,string> = {W:'#22c55e',D:'#f59e0b',L:'#ef4444'};
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',justifyContent:'center',
      width:18,height:18,borderRadius:'50%',fontSize:10,fontWeight:700,
      background:colors[result]??'#e5e7eb',color:'#fff',flexShrink:0,
    }}>{result}</span>
  );
}

const ZONE_COLORS: Record<string,string> = {
  PROMOTION:'#3b82f6', CHAMPIONSHIP:'#f97316', RELEGATION:'#ef4444',
};

export default async function StandingsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { filter = 'all', season: seasonParam } = await searchParams;

  const [leagueRes, standingsRes, matchesRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getStandings(slug),
    getLeagueMatches(slug, seasonParam ?? '2025'),
  ]);

  const league    = leagueRes.status    === 'fulfilled' ? leagueRes.value    : null;
  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value as any[] : [];
  const matches   = matchesRes.status   === 'fulfilled' ? matchesRes.value   as any[] : [];

  if (!league) return (
    <div className="container" style={{paddingTop:28}}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season = seasonParam ?? league.season ?? '2025';
  const {home, away} = calcSplit(matches, standings);
  const sorted = [...standings].sort((a,b) => a.position - b.position);

  const rows = sorted.map((row: any) => {
    if (filter === 'home') {
      const h = home[row.teamId] ?? {w:0,d:0,l:0,gf:0,ga:0,pts:0,played:0};
      return {...row, wins:h.w, draws:h.d, losses:h.l, goalsFor:h.gf, goalsAgainst:h.ga, goalDiff:h.gf-h.ga, points:h.pts, played:h.played};
    }
    if (filter === 'away') {
      const a = away[row.teamId] ?? {w:0,d:0,l:0,gf:0,ga:0,pts:0,played:0};
      return {...row, wins:a.w, draws:a.d, losses:a.l, goalsFor:a.gf, goalsAgainst:a.ga, goalDiff:a.gf-a.ga, points:a.pts, played:a.played};
    }
    return row;
  }).sort((a:any,b:any) => {
    if (filter !== 'all') return b.points-a.points || b.goalDiff-a.goalDiff || b.goalsFor-a.goalsFor;
    return a.position - b.position;
  });

  const FILTER_BTN = (active: boolean): React.CSSProperties => ({
    padding:'7px 18px', borderRadius:20, fontSize:13, fontWeight:600,
    textDecoration:'none', border:'1px solid var(--border)',
    background: active ? '#1e40af' : 'var(--bg-card)',
    color: active ? '#fff' : 'var(--text-muted)',
  });

  const TH: React.CSSProperties = {
    padding:'10px 8px', textAlign:'center', fontSize:11, fontWeight:700,
    letterSpacing:'0.06em', color:'var(--text-dim)', textTransform:'uppercase' as const,
    whiteSpace:'nowrap' as const,
  };

  return (
    <div className="container" style={{paddingTop:20, paddingBottom:60}}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <span>{league.name}</span><span className="breadcrumb__sep">›</span>
        <span style={{color:'var(--text-muted)'}}>Standings</span>
      </nav>

      <LeagueHeader league={league} activeTab="standings" season={season} />

      <div style={{display:'flex', gap:6, marginBottom:16}}>
        {([['all','All'],['home','Home'],['away','Away']] as [string,string][]).map(([val,label]) => (
          <a key={val} href={`/leagues/${slug}/standings?filter=${val}`} style={FILTER_BTN(filter===val)}>{label}</a>
        ))}
      </div>

      {rows.length === 0 ? <EmptyState message="Standings not available yet." /> : (
        <div className="card" style={{overflow:'hidden', marginBottom:16}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', minWidth:340}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)'}}>
                  <th style={{...TH, textAlign:'left', width:36, paddingLeft:12}}>#</th>
                  <th style={{...TH, textAlign:'left', paddingLeft:12}}>Team</th>
                  <th style={TH}>P</th>
                  <th style={TH}>W</th>
                  <th style={TH}>D</th>
                  <th style={TH}>L</th>
                  <th style={{...TH,display:"none"}} className="hide-mobile">GF</th>
                  <th style={{...TH,display:"none"}} className="hide-mobile">GA</th>
                  <th style={TH}>GD</th>
                  <th style={{...TH, color:'var(--blue-bright)'}}>Pts</th>
                  <th style={TH}>Form</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, i: number) => {
                  const zone = row.zone ?? 'NONE';
                  const zoneColor = ZONE_COLORS[zone];
                  const form: string[] = row.form ? row.form.split('') : [];
                  return (
                    <tr key={row.id ?? i} style={{borderBottom:'1px solid var(--border-subtle)'}}>
                      <td style={{padding:'11px 8px 11px 12px', position:'relative'}}>
                        {zoneColor && <span style={{position:'absolute',left:0,top:'20%',bottom:'20%',width:3,borderRadius:2,background:zoneColor}} />}
                        <span style={{fontSize:13, fontWeight:600, color:'var(--text-muted)', paddingLeft:6}}>{filter !== 'all' ? i+1 : row.position}</span>
                      </td>
                      <td style={{padding:'11px 12px'}}>
                        <a href={`/teams/${row.teamSlug}/fixtures`} style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none',color:'var(--text)'}}>
                          <TeamCrest url={row.teamCrest ?? null} name={row.teamName ?? ''} size={22} />
                          <span style={{fontWeight:600, fontSize:14}}>{row.teamName}</span>
                        </a>
                      </td>
                      <td style={{padding:'11px 8px', textAlign:'center', fontSize:13, color:'var(--text-muted)'}}>{row.played}</td>
                      <td style={{padding:'11px 8px', textAlign:'center', fontSize:13, color:'var(--text-muted)'}}>{row.wins}</td>
                      <td style={{padding:'11px 8px', textAlign:'center', fontSize:13, color:'var(--text-muted)'}}>{row.draws}</td>
                      <td style={{padding:'11px 8px', textAlign:'center', fontSize:13, color:'var(--text-muted)'}}>{row.losses}</td>
                      <td style={{padding:'11px 8px', textAlign:'center', fontSize:13, color:'var(--text-muted)'}}>{row.goalsFor}</td>
                      <td style={{padding:'11px 8px', textAlign:'center', fontSize:13, color:'var(--text-muted)'}}>{row.goalsAgainst}</td>
                      <td style={{padding:'11px 8px', textAlign:'center', fontSize:13, fontWeight:600, color: row.goalDiff>0?'var(--green)':row.goalDiff<0?'var(--red)':'var(--text-muted)'}}>
                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                      </td>
                      <td style={{padding:'11px 8px', textAlign:'center', fontWeight:800, fontSize:15, color:'var(--text)'}}>{row.points}</td>
                      <td style={{padding:'11px 12px'}}>
                          <div style={{display:'flex', gap:3, justifyContent:'center'}}>
                            {form.slice(-5).map((r,j) => <FormDot key={j} result={r} />)}
                          </div>
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:20, flexWrap:'wrap'}}>
            {([{color:'#3b82f6',label:'Champions League'},{color:'#f97316',label:'Europa / Playoff'},{color:'#ef4444',label:'Relegation'}]).map(({color,label}) => (
              <span key={label} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text-muted)'}}>
                <span style={{width:10,height:10,borderRadius:'50%',background:color,display:'inline-block'}} />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
