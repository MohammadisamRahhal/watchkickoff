import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import PlayerTabs from './PlayerTabs';

const API = process.env.INTERNAL_API_URL ?? 'http://localhost:3001';

async function fetchPlayer(slug: string) {
  try {
    const r = await fetch(`${API}/api/v1/players/${slug}`, { next: { revalidate: 300 } });
    return r.ok ? (await r.json()).data : null;
  } catch { return null; }
}
async function fetchStats(slug: string) {
  try {
    const r = await fetch(`${API}/api/v1/players/${slug}/stats`, { next: { revalidate: 300 } });
    return r.ok ? ((await r.json()).data ?? []) : [];
  } catch { return []; }
}
async function fetchCareer(slug: string) {
  try {
    const r = await fetch(`${API}/api/v1/players/${slug}/career`, { next: { revalidate: 3600 } });
    return r.ok ? ((await r.json()).data ?? []) : [];
  } catch { return []; }
}
async function fetchMatches(slug: string) {
  try {
    const r = await fetch(`${API}/api/v1/players/${slug}/matches`, { next: { revalidate: 120 } });
    return r.ok ? ((await r.json()).data ?? []) : [];
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await fetchPlayer(params.slug);
  if (!p) return { title: 'Player | WatchKickoff' };
  const pos = ({ GK:'Goalkeeper', DEF:'Defender', MID:'Midfielder', FWD:'Forward' } as any)[p.position] ?? '';
  return {
    title: `${p.name} — ${pos} Stats & Profile | WatchKickoff`,
    description: `${p.name}${p.currentTeam ? ` plays for ${p.currentTeam.name}` : ''}. Goals, assists, career history and ratings.`,
    openGraph: { images: p.photo ? [p.photo] : [] },
  };
}

const FLAG = (c: string) => `https://flagcdn.com/24x18/${c.toLowerCase()}.png`;
const POS_LABEL: Record<string,string> = { GK:'Goalkeeper', DEF:'Defender', MID:'Midfielder', FWD:'Forward' };

export default async function PlayerPage({ params }: { params: { slug: string } }) {
  const [player, stats, career, matches] = await Promise.all([
    fetchPlayer(params.slug),
    fetchStats(params.slug),
    fetchCareer(params.slug),
    fetchMatches(params.slug),
  ]);

  if (!player) notFound();

  const cur = stats.filter((s: any) => s.season === '2025');
  const T = cur.reduce((a: any, s: any) => ({
    goals:   a.goals   + (s.goals||0),
    assists: a.assists + (s.assists||0),
    apps:    a.apps    + (s.appearances||0),
    mins:    a.mins    + (s.minutesPlayed||0),
    shots:   a.shots   + (s.shotsTotal||0),
    yellow:  a.yellow  + (s.yellowCards||0),
    red:     a.red     + (s.redCards||0),
  }), { goals:0, assists:0, apps:0, mins:0, shots:0, yellow:0, red:0 });

  const rated = cur.filter((s: any) => s.rating);
  const avgRating = rated.length
    ? (rated.reduce((a: number, s: any) => a + parseFloat(s.rating), 0) / rated.length).toFixed(1)
    : null;
  const g90 = T.mins > 0 ? ((T.goals/T.mins)*90).toFixed(2) : null;
  const a90 = T.mins > 0 && T.assists > 0 ? ((T.assists/T.mins)*90).toFixed(2) : null;

  const statItems = [
    { v: T.apps||'–',    l:'Apps',    accent: false },
    { v: T.goals||'–',   l:'Goals',   accent: true  },
    { v: T.assists||'–', l:'Assists', accent: false },
    { v: T.shots||'–',   l:'Shots',   accent: false },
    ...(g90  ? [{ v:g90,  l:'G / 90', accent:true  }] : []),
    ...(a90  ? [{ v:a90,  l:'A / 90', accent:false }] : []),
    ...(T.mins>0 ? [{ v:Math.round(T.mins/60)+'h', l:'Mins', accent:false }] : []),
    ...(T.yellow>0 ? [{ v:T.yellow, l:'Yellow', accent:false }] : []),
    ...(T.red>0    ? [{ v:T.red,    l:'Red',    accent:false }] : []),
    ...(avgRating  ? [{ v:avgRating, l:'Rating', accent:true  }] : []),
  ];

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', paddingBottom:48 }}>
      <div className="container" style={{ paddingTop:20 }}>

        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, fontSize:13, color:'var(--text-muted)' }}>
          <Link href="/" style={{ color:'var(--text-muted)' }}>Today</Link>
          <span style={{ color:'var(--border)' }}>›</span>
          {player.currentTeam && (
            <>
              <Link href={`/teams/${player.currentTeam.slug}/fixtures`} style={{ color:'var(--text-muted)' }}>
                {player.currentTeam.name}
              </Link>
              <span style={{ color:'var(--border)' }}>›</span>
            </>
          )}
          <span style={{ color:'var(--text)' }}>{player.name}</span>
        </div>

        {/* Hero — نفس match-hero class */}
        <div className="match-hero" style={{ marginBottom:12, padding:0, overflow:'hidden' }}>
          <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'auto 1fr', gap:20, alignItems:'center' }}>

            {/* Photo */}
            <div style={{ position:'relative', flexShrink:0 }}>
              {player.photo
                ? <img src={player.photo} alt={player.name} style={{ width:96, height:96, borderRadius:'50%', objectFit:'cover', objectPosition:'top', border:'3px solid var(--border)', background:'var(--bg-elevated)' }} />
                : <div style={{ width:96, height:96, borderRadius:'50%', background:'var(--bg-elevated)', border:'3px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem' }}>⚽</div>
              }
              {player.position && (
                <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', background:'var(--green)', color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'0.1em', padding:'2px 8px', borderRadius:99, whiteSpace:'nowrap', fontFamily:'var(--font-display)' }}>
                  {POS_LABEL[player.position]?.toUpperCase() ?? player.position}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:'var(--text)', lineHeight:1, margin:'0 0 10px', letterSpacing:'0.02em' }}>
                {player.name}
              </h1>
              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:8 }}>
                {player.nationalityCode && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'3px 10px', fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>
                    <img src={FLAG(player.nationalityCode)} alt="" width={18} height={13} style={{ borderRadius:2 }} />
                    {player.nationalityCode.toUpperCase()}
                  </span>
                )}
                {player.age && (
                  <span style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'3px 10px', fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>
                    {player.age} yrs
                    {player.dateOfBirth && <span style={{ color:'var(--text-dim)', marginLeft:4 }}>· {new Date(player.dateOfBirth).getFullYear()}</span>}
                  </span>
                )}
                {player.heightCm && (
                  <span style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'3px 10px', fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>
                    {player.heightCm} cm
                  </span>
                )}
                {player.preferredFoot && (
                  <span style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'3px 10px', fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>
                    {player.preferredFoot} foot
                  </span>
                )}
                {player.currentTeam && (
                  <Link href={`/teams/${player.currentTeam.slug}/fixtures`} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'3px 10px', fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>
                    {player.currentTeam.crest && <img src={player.currentTeam.crest} alt="" width={16} height={16} style={{ borderRadius:2, objectFit:'contain' }} />}
                    {player.currentTeam.name}
                  </Link>
                )}
                {player.status && (
                  <span style={{ background: player.status==='ACTIVE'?'var(--green-dim)':'var(--red-dim)', color: player.status==='ACTIVE'?'var(--green)':'var(--red)', border:`1px solid ${player.status==='ACTIVE'?'rgba(30,64,175,0.2)':'rgba(229,57,53,0.2)'}`, borderRadius:99, padding:'3px 10px', fontSize:12, fontWeight:700, letterSpacing:'0.05em', display:'inline-flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block' }}/>
                    {player.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ borderTop:'1px solid var(--border)', background:'var(--bg-elevated)', display:'flex', flexWrap:'wrap', padding:'0' }}>
            {statItems.map(({ v, l, accent }) => (
              <div key={l} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 20px', borderRight:'1px solid var(--border)', gap:2 }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, lineHeight:1, color: accent?'var(--green)':'var(--text)' }}>{v}</span>
                <span style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs + Content */}
        <PlayerTabs stats={stats} career={career} recentMatches={matches} player={player} />
      </div>
    </div>
  );
}
