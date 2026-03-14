import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueMatches, getLeagueRounds, getStandings } from '@/lib/api';
import { MatchRow, ErrorBanner, EmptyState } from '@/components/ui';
import { isLive } from '@/lib/utils';
import LeagueHeader from '@/components/LeagueHeader';
import GroupDropdown from '@/components/GroupDropdown';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string; round?: string; group?: string; team?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const l = await getLeagueBySlug(slug);
    const yr = Number(l.season ?? 2025);
    return { title: `${l.name} ${yr}/${yr+1} Fixtures` };
  } catch { return { title: 'Fixtures' }; }
}

function sortRounds(rounds: string[]): string[] {
  return [...rounds].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g,'') || '0');
    const nb = parseInt(b.replace(/\D/g,'') || '0');
    if (na && nb) return na - nb;
    return a.localeCompare(b);
  });
}

function groupByDate(matches: any[]): { label: string; iso: string; matches: any[] }[] {
  const map = new Map<string,{ label:string; iso:string; matches:any[] }>();
  const today = new Date().toISOString().slice(0,10);
  for (const m of matches) {
    const d = new Date(m.kickoffAt);
    const iso = d.toISOString().slice(0,10);
    const isToday = iso === today;
    const isTomorrow = iso === (() => { const t=new Date(); t.setDate(t.getDate()+1); return t.toISOString().slice(0,10); })();
    const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
    if (!map.has(iso)) map.set(iso,{label,iso,matches:[]});
    map.get(iso)!.matches.push(m);
  }
  return Array.from(map.values()).sort((a,b)=>a.iso.localeCompare(b.iso));
}

function getCurrentRound(sorted: any[], allRounds: string[]): string | null {
  const upcoming = sorted.filter((m:any)=>!['FINISHED','CANCELLED','POSTPONED','AWARDED'].includes(m.status));
  if (!upcoming.length) return allRounds[allRounds.length-1] ?? null;
  const rc: Record<string,number> = {};
  for (const m of upcoming) { const r = m.round ?? ''; rc[r]=(rc[r]??0)+1; }
  return Object.entries(rc).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? null;
}

const DIVIDER: React.CSSProperties = {
  padding:'8px 14px', background:'var(--bg-elevated)',
  fontSize:12, fontWeight:700, color:'var(--text-muted)',
  letterSpacing:'0.05em', textTransform:'uppercase',
  borderBottom:'1px solid var(--border)',
};

const NAV_BTN: React.CSSProperties = {
  width:36, height:36, borderRadius:'50%', background:'var(--bg-card)',
  border:'1px solid var(--border)', display:'flex', alignItems:'center',
  justifyContent:'center', fontSize:18, color:'var(--text)',
  textDecoration:'none', flexShrink:0, fontWeight:700, lineHeight:1,
};

export default async function LeagueFixturesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { season: seasonParam, round: roundParam, group = 'by-date', team: teamSlug } = await searchParams;

  const [leagueRes, roundsRes, standingsRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueRounds(slug, seasonParam),
    getStandings(slug),
  ]);

  const league    = leagueRes.status    === 'fulfilled' ? leagueRes.value    : null;
  const allRounds = roundsRes.status    === 'fulfilled' ? sortRounds(roundsRes.value) : [];
  const standings = standingsRes.status === 'fulfilled' ? standingsRes.value as any[] : [];

  if (!league) return (
    <div className="container" style={{ paddingTop:28 }}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season  = seasonParam ?? league.season ?? '2025';
  const matches = await getLeagueMatches(slug, season, group==='by-round' ? roundParam : undefined).catch(()=>[]);
  const live    = matches.filter((m:any)=>isLive(m.status));

  const sorted = [...matches].sort((a:any,b:any)=>
    new Date(a.kickoffAt).getTime()-new Date(b.kickoffAt).getTime()
  );

  const today = new Date().toISOString().slice(0,10);

  // by-date — start from today, fall back to all if nothing upcoming
  const allDateGroups = groupByDate(sorted);
  const futureDateGroups = allDateGroups.filter(g => g.iso >= today);
  const dateGroups = futureDateGroups.length > 0 ? futureDateGroups : allDateGroups;

  // by-round
  const currentRound = roundParam ?? getCurrentRound(sorted, allRounds);
  const currentRoundIndex = currentRound ? allRounds.indexOf(currentRound) : -1;
  const prevRound = currentRoundIndex > 0 ? allRounds[currentRoundIndex-1] : null;
  const nextRound = currentRoundIndex < allRounds.length-1 ? allRounds[currentRoundIndex+1] : null;
  const roundMatches = currentRound ? sorted.filter((m:any)=>m.round===currentRound) : sorted;
  const roundDateGroups = groupByDate(roundMatches);

  // by-team
  const teams = [...standings]
    .sort((a:any,b:any)=>a.position-b.position)
    .map((s:any)=>({id:s.teamId, name:s.teamName, crest:s.teamCrest, slug:s.teamSlug}));
  const selectedTeam = teams.find(t=>t.slug===teamSlug) ?? teams[0] ?? null;
  const teamMatches = selectedTeam
    ? sorted.filter((m:any)=>m.homeTeam?.slug===selectedTeam.slug||m.awayTeam?.slug===selectedTeam.slug)
    : sorted;
  const teamDateGroups = groupByDate(teamMatches);

  function renderDateGroups(groups: { label:string; iso:string; matches:any[] }[]) {
    if (groups.length === 0) return <EmptyState message="No fixtures available." />;
    return (
      <div className="card" style={{ overflow:'hidden' }}>
        {groups.map(({ label, iso, matches: dayMatches }) => (
          <div key={iso}>
            <div style={DIVIDER}>{label}</div>
            {dayMatches.map((m:any) => <MatchRow key={m.id} match={m} />)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop:20, paddingBottom:60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <span>{league.name}</span><span className="breadcrumb__sep">›</span>
        <span style={{color:'var(--text-muted)'}}>Fixtures</span>
      </nav>

      <LeagueHeader league={league} activeTab="fixtures" season={season} liveCount={live.length} />
      <GroupDropdown slug={slug} season={season} group={group} teams={teams} selectedTeamSlug={teamSlug ?? selectedTeam?.slug} />

      {matches.length === 0 ? <EmptyState message="No fixtures available." /> : (
        <>
          {/* By-round nav */}
          {group === 'by-round' && allRounds.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 16px' }}>
              {prevRound
                ? <a href={`/leagues/${slug}/fixtures?season=${season}&group=by-round&round=${encodeURIComponent(prevRound)}`} style={NAV_BTN}>‹</a>
                : <div style={{width:36}} />}
              <div style={{ flex:1, textAlign:'center' }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--text)' }}>
                  {currentRound ? (currentRound.match(/\d+/) ? `Round ${currentRound.match(/\d+/)![0]}` : currentRound) : 'All Rounds'}
                </span>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                  {roundMatches.filter((m:any)=>m.status==='FINISHED').length} / {roundMatches.length} played
                </div>
              </div>
              {nextRound
                ? <a href={`/leagues/${slug}/fixtures?season=${season}&group=by-round&round=${encodeURIComponent(nextRound)}`} style={NAV_BTN}>›</a>
                : <div style={{width:36}} />}
            </div>
          )}

          {/* By-team header */}
          {group === 'by-team' && selectedTeam && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, padding:'10px 14px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10 }}>
              {selectedTeam.crest && <img src={selectedTeam.crest} style={{width:28,height:28,objectFit:'contain'}} alt="" />}
              <span style={{ fontWeight:700, fontSize:15 }}>{selectedTeam.name}</span>
              <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:'auto' }}>{teamMatches.length} matches</span>
            </div>
          )}

          {group === 'by-round'
            ? renderDateGroups(roundDateGroups)
            : group === 'by-team'
            ? renderDateGroups(teamDateGroups)
            : renderDateGroups(dateGroups)}
        </>
      )}
    </div>
  );
}
