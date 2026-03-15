import type { Metadata } from 'next';
import { getTodayMatches, getMatchesByDate } from '@/lib/api';
import { isLive, isFinished } from '@/lib/utils';
import type { MatchSummary } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: "Live Football Scores & Results — WatchKickoff",
  description: "Live scores, fixtures and results from 500+ leagues worldwide.",
};
export const dynamic = 'force-dynamic';

// Exact slug priority — ONLY these get top spots
const SLUG_PRIORITY: Record<string,number> = {
  'uefa-champions-league-2025-2026': 0,
  'premier-league-2025-2026': 1,
  'la-liga-2025-2026': 2,
  'serie-a-2025-2026': 3,
  'bundesliga-2025-2026': 4,
  'ligue-1-2025-2026': 5,
  'europa-league-2025-2026': 6,
  'saudi-pro-league-2025-2026': 7,
  'fa-cup-2025-2026': 8,
  'copa-del-rey-2025-2026': 9,
  'primeira-liga-2024-2025': 10,
  'eredivisie-2024-2025': 11,
  'liga-mx-2024-2025': 12,
  'super-lig-2024-2025': 13,
  'league-71-2026': 14,
  'liga-profesional-argentina-2025-2026': 15,
};

function getPriority(slug: string): number {
  if (SLUG_PRIORITY[slug] !== undefined) return SLUG_PRIORITY[slug];
  // partial match for known bases
  const bases = Object.keys(SLUG_PRIORITY);
  for (const b of bases) {
    const base = b.replace(/-\d{4}-\d{4}$|-\d{4}$/, '');
    if (slug.startsWith(base + '-')) return SLUG_PRIORITY[b] + 0.5;
  }
  return 999;
}

type LGroup = { name:string; cc:string; logo:string|null; slug:string; pri:number; matches:MatchSummary[] };

function groupMatches(matches: MatchSummary[]): LGroup[] {
  const map = new Map<string, LGroup>();
  for (const m of matches) {
    const a = m as any;
    const id = m.leagueId;
    if (!map.has(id)) {
      const slug = a.leagueSlug ?? '';
      map.set(id, { name: a.leagueName ?? id.slice(0,8), cc: a.leagueCountryCode ?? 'WW', logo: a.leagueLogoUrl ?? null, slug, pri: getPriority(slug), matches: [] });
    }
    map.get(id)!.matches.push(m);
  }
  return [...map.values()].sort((a,b) => a.pri !== b.pri ? a.pri - b.pri : b.matches.length - a.matches.length);
}

function fmtIso(d: Date) { return d.toISOString().slice(0,10); }
function fmtDay(d: Date, today: string) {
  const iso = fmtIso(d);
  if (iso === today) return 'Today';
  const t = new Date(today); t.setDate(t.getDate()+1);
  if (iso === fmtIso(t)) return 'Tomorrow';
  const y = new Date(today); y.setDate(y.getDate()-1);
  if (iso === fmtIso(y)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday:'short' });
}
function fmtTime(s: string) {
  if (!s) return '';
  return new Date(s).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}
function statusStr(status: string, min?: number|null) {
  if (['LIVE_1H','LIVE_2H'].includes(status)) return min ? `${min}'` : 'LIVE';
  if (status==='HALF_TIME') return 'HT';
  if (status==='EXTRA_TIME') return min ? `${min}'` : 'ET';
  if (status==='PENALTIES') return 'PEN';
  if (status==='FINISHED') return 'FT';
  if (status==='POSTPONED') return 'PST';
  if (status==='CANCELLED') return 'CANC';
  return '';
}

const FLAGS: Record<string,string> = {
  GB:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',ES:'🇪🇸',IT:'🇮🇹',DE:'🇩🇪',FR:'🇫🇷',PT:'🇵🇹',NL:'🇳🇱',
  BR:'🇧🇷',AR:'🇦🇷',SA:'🇸🇦',US:'🇺🇸',MX:'🇲🇽',TR:'🇹🇷',RU:'🇷🇺',
  AU:'🇦🇺',JP:'🇯🇵',CN:'🇨🇳',KR:'🇰🇷',EG:'🇪🇬',MA:'🇲🇦',NG:'🇳🇬',
  JM:'🇯🇲',CO:'🇨🇴',CL:'🇨🇱',UY:'🇺🇾',EC:'🇪🇨',PE:'🇵🇪',
};
function cc2flag(cc: string) { return FLAGS[cc] ?? '🌍'; }

const TOP_LEAGUES = [
  {n:'UCL',s:'uefa-champions-league-2025-2026',f:'⭐',logo:'https://media.api-sports.io/football/leagues/2.png'},
  {n:'Premier',s:'premier-league-2025-2026',f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',logo:'https://media.api-sports.io/football/leagues/39.png'},
  {n:'La Liga',s:'la-liga-2025-2026',f:'🇪🇸',logo:'https://media.api-sports.io/football/leagues/140.png'},
  {n:'Serie A',s:'serie-a-2025-2026',f:'🇮🇹',logo:'https://media.api-sports.io/football/leagues/135.png'},
  {n:'Bundesliga',s:'bundesliga-2025-2026',f:'🇩🇪',logo:'https://media.api-sports.io/football/leagues/78.png'},
  {n:'Ligue 1',s:'ligue-1-2025-2026',f:'🇫🇷',logo:'https://media.api-sports.io/football/leagues/61.png'},
  {n:'Europa',s:'europa-league-2025-2026',f:'🟠',logo:'https://media.api-sports.io/football/leagues/3.png'},
  {n:'Saudi PL',s:'saudi-pro-league-2025-2026',f:'🇸🇦',logo:'https://media.api-sports.io/football/leagues/307.png'},
];

function MRow({ m }: { m: MatchSummary }) {
  const a = m as any;
  const live = isLive(m.status);
  const done = isFinished(m.status);
  const score = live || done;
  const isHT = m.status === 'HALF_TIME';
  const lbl = statusStr(m.status, a.minute);
  const hw = score && m.homeScore > m.awayScore;
  const aw = score && m.awayScore > m.homeScore;
  return (
    <a href={`/matches/${m.slug}`} className={`mr${live?' mr-live':''}`}>
      <div className="mr-team mr-home">
        <span className={`mr-nm${hw?' mr-nm-w':''}`}>{(m.homeTeam as any).shortName ?? m.homeTeam.name}</span>
        <div className="mr-crest">
          {m.homeTeam.crestUrl
            ? <img src={m.homeTeam.crestUrl} alt="" width={22} height={22} style={{objectFit:'contain'}} />
            : <span className="mr-fb">{m.homeTeam.name[0]}</span>}
        </div>
      </div>
      <div className="mr-mid">
        {score
          ? <div className={`mr-sc${live?' mr-sc-live':''}`}>
              <span className={hw?'mr-sc-w':''} >{m.homeScore}</span>
              <span className="mr-dash">–</span>
              <span className={aw?'mr-sc-w':''} >{m.awayScore}</span>
            </div>
          : <div className="mr-time">{fmtTime(a.kickoffAt ?? '')}</div>}
        {lbl && (
          <div className={`mr-lbl${live&&!isHT?' mr-lbl-live':''} ${isHT?'mr-lbl-ht':''} ${done?'mr-lbl-ft':''}`}>
            {live && !isHT && <span className="rdot" />}{lbl}
          </div>
        )}
      </div>
      <div className="mr-team mr-away">
        <div className="mr-crest">
          {m.awayTeam.crestUrl
            ? <img src={m.awayTeam.crestUrl} alt="" width={22} height={22} style={{objectFit:'contain'}} />
            : <span className="mr-fb">{m.awayTeam.name[0]}</span>}
        </div>
        <span className={`mr-nm${aw?' mr-nm-w':''}`}>{(m.awayTeam as any).shortName ?? m.awayTeam.name}</span>
      </div>
    </a>
  );
}

function LG({ g }: { g: LGroup }) {
  return (
    <div className="lg">
      <a href={g.slug ? `/leagues/${g.slug}` : '#'} className="lg-hd">
        <div className="lg-hd-l">
          {g.logo
            ? <img src={g.logo} alt="" width={18} height={18} style={{objectFit:'contain',flexShrink:0}} />
            : <span className="lg-flag">{cc2flag(g.cc)}</span>}
          <span className="lg-name">{g.name}</span>
          {g.pri < 8 && <span className="lg-top-badge">TOP</span>}
        </div>
        <span className="lg-more">{g.matches.length} ›</span>
      </a>
      <div className="lg-rows">
        {g.matches.map(m => <MRow key={m.id} m={m} />)}
      </div>
    </div>
  );
}

function Sec({ title, n, type, groups }: { title:string; n:number; type:'live'|'up'|'done'; groups:LGroup[] }) {
  if (!groups.length) return null;
  return (
    <section className="sec">
      <div className={`sec-hd sec-hd-${type}`}>
        {type==='live' && <span className="rdot" style={{flexShrink:0}} />}
        <span className="sec-title">{title}</span>
        <span className={`sec-n sec-n-${type}`}>{n}</span>
      </div>
      {groups.map((g,i) => <LG key={i} g={g} />)}
    </section>
  );
}

interface Props { searchParams: Promise<{ date?: string }> }

export default async function HomePage({ searchParams }: Props) {
  const { date: dp } = await searchParams;
  const today = fmtIso(new Date());
  const active = dp && /^\d{4}-\d{2}-\d{2}$/.test(dp) ? dp : today;
  const isToday = active === today;

  let matches: MatchSummary[] = [];
  let err: string|null = null;
  try {
    matches = isToday ? await getTodayMatches() : await getMatchesByDate(active);
  } catch { err = 'Could not load matches.'; }

  const live     = matches.filter(m => isLive(m.status));
  const done     = matches.filter(m => isFinished(m.status));
  const upcoming = matches.filter(m => !isLive(m.status) && !isFinished(m.status));

  const strip: Date[] = [];
  for (let i=-3; i<=3; i++) { const d=new Date(); d.setDate(d.getDate()+i); strip.push(d); }

  const displayDate = new Date(active+'T12:00:00Z')
    .toLocaleDateString('en-GB', {weekday:'long',day:'numeric',month:'long',year:'numeric'});

  return (
    <div className="hp">
      <div className="ds">
        <div className="ds-in">
          {strip.map(d => {
            const iso = fmtIso(d);
            const on = iso === active;
            return (
              <a key={iso} href={iso===today?'/':`/?date=${iso}`} className={`dp${on?' dp-on':''}`}>
                <span className="dp-day">{fmtDay(d, today)}</span>
                <span className="dp-num">{d.getDate()}</span>
              </a>
            );
          })}
        </div>
      </div>

            <div className="hp-body">
        <main className="hp-main">
          <div className="hp-hd">
            <h1 className="hp-title">{isToday ? 'Today' : displayDate}</h1>
            {matches.length > 0 && (
              <div className="hp-chips">
                {live.length > 0 && <span className="chip chip-live"><span className="rdot" />{live.length} Live</span>}
                <span className="chip">{upcoming.length} Upcoming</span>
                <span className="chip chip-dim">{done.length} Results</span>
                <span className="chip chip-total">{matches.length} Total</span>
              </div>
            )}
          </div>
          {err && <div className="hp-err">{err}</div>}
          {!err && matches.length===0 && (
            <div className="hp-empty">
              <span style={{fontSize:32,opacity:0.2}}>⚽</span>
              <span>No matches for {displayDate}</span>
            </div>
          )}
          <Sec title="Live Now"  n={live.length}     type="live" groups={groupMatches(live)} />
          <Sec title="Upcoming"  n={upcoming.length} type="up"   groups={groupMatches(upcoming)} />
          <Sec title="Results"   n={done.length}     type="done" groups={groupMatches(done)} />
        </main>

        <aside className="hp-sb">
          <div className="sb-card">
            <div className="sb-ttl">Top Leagues</div>
            {TOP_LEAGUES.map(l => (
              <a key={l.s} href={`/leagues/${l.s}`} className="sb-lg">
                {l.logo
                  ? <img src={l.logo} alt={l.n} width={20} height={20} style={{objectFit:'contain',flexShrink:0}} />
                  : <span style={{fontSize:16,lineHeight:1,flexShrink:0}}>{l.f}</span>}
                <span className="sb-lg-n">{l.n}</span>
                <span className="sb-arr">›</span>
              </a>
            ))}
            <a href="/leagues" className="sb-more">View All Leagues →</a>
          </div>
          {live.length > 0 && (
            <div className="sb-card sb-live-card">
              <div className="sb-ttl" style={{color:'#dc2626',display:'flex',alignItems:'center',gap:8}}>
                <span className="rdot" />Live Now
              </div>
              <div className="sb-live-n">
                <span className="sb-live-num">{live.length}</span>
                <span style={{color:'var(--text-muted)',fontSize:13}}>in progress</span>
              </div>
              <a href="/live" className="sb-more" style={{color:'#dc2626'}}>View All Live →</a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
