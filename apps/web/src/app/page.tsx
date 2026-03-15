import type { Metadata } from 'next';
import { getTodayMatches, getMatchesByDate } from '@/lib/api';
import { countryFlag, isLive, isFinished } from '@/lib/utils';
import type { MatchSummary } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: "Live Football Scores & Results — WatchKickoff",
  description: "Live scores, fixtures and results from 500+ leagues worldwide.",
};

export const dynamic = 'force-dynamic';

// TOP 8 leagues always shown first — matched by slug prefix
const TOP8_PREFIXES = [
  'uefa-champions-league-',
  'premier-league-2025-',        // GB English PL only
  'la-liga-2025-',
  'serie-a-2025-',
  'bundesliga-2025-',
  'ligue-1-2025-',
  'europa-league-2025-',
  'saudi-pro-league-2025-',
];

// Secondary priority leagues (shown after top 8)
const SECONDARY_PREFIXES = [
  'fa-cup-',
  'copa-del-rey-',
  'primeira-liga-',
  'eredivisie-',
  'mls-',
  'champions-league-',
  'serie-a-women-',
];

function getLeaguePriority(slug: string, name: string): number {
  // TOP 8 — always first, exact season prefix match
  for (let i = 0; i < TOP8_PREFIXES.length; i++) {
    if (slug.startsWith(TOP8_PREFIXES[i])) return i;
  }
  // Secondary — shown after top 8 but before rest
  for (let i = 0; i < SECONDARY_PREFIXES.length; i++) {
    if (slug.startsWith(SECONDARY_PREFIXES[i])) return 100 + i;
  }
  // Everything else — sorted by match count
  return 999;
}

function groupByLeague(matches: MatchSummary[]) {
  const groups = new Map<string, { matches: MatchSummary[]; name: string; countryCode: string; logoUrl: string | null; leagueSlug: string; priority: number }>();
  for (const m of matches) {
    const id = m.leagueId;
    if (!groups.has(id)) {
      const name = (m as any).leagueName ?? `League ${id.slice(0,6)}`;
      const slug = (m as any).leagueSlug ?? '';
      groups.set(id, { matches: [], name, countryCode: (m as any).leagueCountryCode ?? 'WW', logoUrl: (m as any).leagueLogoUrl ?? null, leagueSlug: slug, priority: getLeaguePriority(slug, name) });
    }
    groups.get(id)!.matches.push(m);
  }
  return [...groups.entries()].sort((a, b) => {
    const pa = a[1].priority, pb = b[1].priority;
    if (pa !== pb) return pa - pb;
    return b[1].matches.length - a[1].matches.length;
  });
}

function fmtIso(d: Date) { return d.toISOString().split('T')[0]; }

function fmtDay(d: Date, todayIso: string) {
  const iso = fmtIso(d);
  if (iso === todayIso) return 'Today';
  const t = new Date(); t.setDate(t.getDate() + 1);
  if (iso === fmtIso(t)) return 'Tomorrow';
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (iso === fmtIso(y)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short' });
}

function fmtTime(kickoffAt: string) {
  if (!kickoffAt) return '';
  return new Date(kickoffAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getStatusLabel(status: string, minute?: number | null) {
  if (status === 'LIVE_1H' || status === 'LIVE_2H') return minute ? `${minute}'` : 'LIVE';
  if (status === 'HALF_TIME') return 'HT';
  if (status === 'EXTRA_TIME') return minute ? `${minute}'` : 'ET';
  if (status === 'PENALTIES') return 'PEN';
  if (status === 'FINISHED') return 'FT';
  if (status === 'POSTPONED') return 'PST';
  if (status === 'CANCELLED') return 'CANC';
  return '';
}

function MatchRow({ match }: { match: MatchSummary }) {
  const live     = isLive(match.status);
  const finished = isFinished(match.status);
  const showScore = live || finished;
  const isHT = match.status === 'HALF_TIME';
  const label = getStatusLabel(match.status, match.minute);
  const homeWin = showScore && match.homeScore > match.awayScore;
  const awayWin = showScore && match.awayScore > match.homeScore;

  return (
    <a href={`/matches/${match.slug}`} className={`mrow${live ? ' mrow--live' : ''}${finished ? ' mrow--done' : ''}`}>
      <div className="mrow__home">
        <span className={`mrow__name${homeWin ? ' mrow__name--w' : ''}`}>
          {match.homeTeam.shortName ?? match.homeTeam.name}
        </span>
        <div className="mrow__crest">
          {match.homeTeam.crestUrl
            ? <img src={match.homeTeam.crestUrl} alt="" width={20} height={20} style={{objectFit:'contain'}} />
            : <span className="mrow__crest-fb">{match.homeTeam.name.slice(0,1)}</span>}
        </div>
      </div>

      <div className="mrow__mid">
        {showScore ? (
          <div className={`mrow__score${live ? ' mrow__score--live' : ''}`}>
            <span className={homeWin ? 'mrow__snum--w' : ''}>{match.homeScore}</span>
            <span className="mrow__sdash">–</span>
            <span className={awayWin ? 'mrow__snum--w' : ''}>{match.awayScore}</span>
          </div>
        ) : (
          <div className="mrow__time">{fmtTime((match as any).kickoffAt ?? '')}</div>
        )}
        {label && (
          <div className={`mrow__status${live && !isHT ? ' mrow__status--live' : ''}${isHT ? ' mrow__status--ht' : ''}${finished ? ' mrow__status--ft' : ''}`}>
            {live && !isHT && <span className="pulse-dot" />}
            {label}
          </div>
        )}
      </div>

      <div className="mrow__away">
        <div className="mrow__crest">
          {match.awayTeam.crestUrl
            ? <img src={match.awayTeam.crestUrl} alt="" width={20} height={20} style={{objectFit:'contain'}} />
            : <span className="mrow__crest-fb">{match.awayTeam.name.slice(0,1)}</span>}
        </div>
        <span className={`mrow__name${awayWin ? ' mrow__name--w' : ''}`}>
          {match.awayTeam.shortName ?? match.awayTeam.name}
        </span>
      </div>
    </a>
  );
}

function LeagueGroup({ id, group }: { id: string; group: any }) {
  return (
    <div className="lg">
      <a href={group.leagueSlug ? `/leagues/${group.leagueSlug}` : '#'} className="lg__hd">
        <div className="lg__hd-left">
          {group.logoUrl
            ? <img src={group.logoUrl} alt="" width={16} height={16} style={{objectFit:'contain',flexShrink:0}} />
            : <span className="lg__flag">{countryFlag(group.countryCode)}</span>}
          <span className="lg__name">{group.name}</span>
        </div>
        <span className="lg__cnt">{group.matches.length} matches ›</span>
      </a>
      {group.matches.map((m: MatchSummary) => <MatchRow key={m.id} match={m} />)}
    </div>
  );
}

const TOP_LEAGUES = [
  { name: 'UCL',        slug: 'uefa-champions-league-2025-2026', flag: '⭐' },
  { name: 'Premier',    slug: 'premier-league-2025-2026',        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'La Liga',    slug: 'la-liga-2025-2026',               flag: '🇪🇸' },
  { name: 'Serie A',    slug: 'serie-a-2025-2026',               flag: '🇮🇹' },
  { name: 'Bundesliga', slug: 'bundesliga-2025-2026',            flag: '🇩🇪' },
  { name: 'Ligue 1',    slug: 'ligue-1-2025-2026',               flag: '🇫🇷' },
  { name: 'Europa',     slug: 'europa-league-2025-2026',         flag: '🟠' },
  { name: 'Saudi PL',   slug: 'saudi-pro-league-2025-2026',      flag: '🇸🇦' },
];

interface Props { searchParams: Promise<{ date?: string }> }

export default async function HomePage({ searchParams }: Props) {
  const { date: dateParam } = await searchParams;
  const todayIso = fmtIso(new Date());
  const isValidDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam);
  const activeDate = isValidDate ? dateParam : todayIso;
  const isToday = activeDate === todayIso;

  let matches: MatchSummary[] = [];
  let error: string | null = null;
  try {
    matches = isToday ? await getTodayMatches() : await getMatchesByDate(activeDate);
  } catch { error = 'Could not load matches.'; }

  const live     = matches.filter(m => isLive(m.status));
  const finished = matches.filter(m => isFinished(m.status));
  const upcoming = matches.filter(m => !isLive(m.status) && !isFinished(m.status));

  const dateStrip: Date[] = [];
  for (let i = -3; i <= 3; i++) { const d = new Date(); d.setDate(d.getDate() + i); dateStrip.push(d); }

  const displayDate = new Date(activeDate + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  return (
    <div className="hp">

      {/* Date strip */}
      <div className="hp-dstrip">
        <div className="hp-dstrip__in">
          {dateStrip.map(d => {
            const iso = fmtIso(d);
            const on = iso === activeDate;
            const href = iso === todayIso ? '/' : `/?date=${iso}`;
            return (
              <a key={iso} href={href} className={`hp-dp${on ? ' hp-dp--on' : ''}`}>
                <span className="hp-dp__day">{fmtDay(d, todayIso)}</span>
                <span className="hp-dp__num">{d.getDate()}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Top leagues quick nav */}
      <div className="hp-qnav">
        <div className="hp-qnav__in">
          <span className="hp-qnav__lbl">LEAGUES</span>
          {TOP_LEAGUES.map(l => (
            <a key={l.slug} href={`/leagues/${l.slug}`} className="hp-ql">
              <span>{l.flag}</span>
              <span className="hp-ql__name">{l.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="hp-body">
        <div className="hp-main">

          {/* Summary bar */}
          <div className="hp-sumbar">
            <div className="hp-sumbar__title">
              {isToday ? 'Today' : displayDate}
            </div>
            {matches.length > 0 && (
              <div className="hp-pills">
                {live.length > 0 && <span className="hp-pill hp-pill--live"><span className="pulse-dot" />{live.length} Live</span>}
                <span className="hp-pill">{upcoming.length} Upcoming</span>
                <span className="hp-pill hp-pill--muted">{finished.length} Finished</span>
                <span className="hp-pill hp-pill--total">{matches.length} Total</span>
              </div>
            )}
          </div>

          {error && <div className="hp-err">{error}</div>}

          {matches.length === 0 && !error && (
            <div className="hp-empty">
              <div className="hp-empty__ico">⚽</div>
              <div>No matches scheduled</div>
            </div>
          )}

          {/* Live */}
          {live.length > 0 && (
            <section className="hp-sec">
              <div className="hp-sec__hd hp-sec__hd--live">
                <span className="pulse-dot" style={{flexShrink:0}} />
                <span>Live Now</span>
                <span className="hp-sec__n">{live.length}</span>
              </div>
              {groupByLeague(live).map(([id, g]) => <LeagueGroup key={id} id={id} group={g} />)}
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="hp-sec">
              <div className="hp-sec__hd hp-sec__hd--upcoming">
                <span>Upcoming</span>
                <span className="hp-sec__n">{upcoming.length}</span>
              </div>
              {groupByLeague(upcoming).map(([id, g]) => <LeagueGroup key={id} id={id} group={g} />)}
            </section>
          )}

          {/* Finished */}
          {finished.length > 0 && (
            <section className="hp-sec">
              <div className="hp-sec__hd hp-sec__hd--done">
                <span>Results</span>
                <span className="hp-sec__n">{finished.length}</span>
              </div>
              {groupByLeague(finished).map(([id, g]) => <LeagueGroup key={id} id={id} group={g} />)}
            </section>
          )}

        </div>

        {/* Sidebar */}
        <aside className="hp-sb">
          <div className="hp-sb-card">
            <div className="hp-sb-card__ttl">Top Leagues</div>
            {TOP_LEAGUES.map(l => (
              <a key={l.slug} href={`/leagues/${l.slug}`} className="hp-sb-lg">
                <span style={{fontSize:15}}>{l.flag}</span>
                <span className="hp-sb-lg__name">{l.name}</span>
                <span className="hp-sb-lg__arr">›</span>
              </a>
            ))}
            <a href="/leagues" className="hp-sb-card__more">View All Leagues →</a>
          </div>
          {live.length > 0 && (
            <div className="hp-sb-card hp-sb-card--live">
              <div className="hp-sb-card__ttl" style={{color:'#dc2626'}}>
                <span className="pulse-dot" style={{marginRight:6}} />Live Now
              </div>
              <div className="hp-sb-live-n">{live.length} match{live.length !== 1 ? 'es' : ''} in progress</div>
              <a href="/live" className="hp-sb-card__more" style={{color:'#dc2626'}}>View All Live →</a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
