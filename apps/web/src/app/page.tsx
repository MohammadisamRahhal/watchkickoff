import type { Metadata } from 'next';
import { getTodayMatches } from '@/lib/api';
import { formatDate, countryFlag, isLive, isFinished } from '@/lib/utils';
import { MatchRow, MatchGroup, EmptyState, ErrorBanner } from '@/components/ui';
import type { MatchSummary } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: "Today's Football Scores & Results — WatchKickoff",
  description: "Live scores and results for today's football matches from 500+ leagues worldwide.",
};

export const revalidate = 60;

const TOP_LEAGUE_NAMES = [
  'UEFA Champions League','Premier League','La Liga','Serie A','Bundesliga','Ligue 1',
  'UEFA Europa League','UEFA Conference League','FA Cup','Copa del Rey','DFB Pokal',
  'Coppa Italia','Saudi Pro League','AFC Champions League','World Cup','Euro',
  'Nations League','MLS','Eredivisie','Primeira Liga',
];

function getLeaguePriority(name: string): number {
  const n = name.toLowerCase();
  for (let i = 0; i < TOP_LEAGUE_NAMES.length; i++) {
    if (n.includes(TOP_LEAGUE_NAMES[i].toLowerCase())) return i;
  }
  return TOP_LEAGUE_NAMES.length;
}

function groupByLeague(matches: MatchSummary[]) {
  const groups = new Map<string, {
    matches: MatchSummary[]; name: string; countryCode: string;
    logoUrl: string | null; leagueSlug: string; priority: number;
  }>();
  for (const m of matches) {
    const id = m.leagueId;
    if (!groups.has(id)) {
      const name = (m as any).leagueName ?? `League ${id.slice(0, 6)}`;
      groups.set(id, {
        matches: [], name,
        countryCode: (m as any).leagueCountryCode ?? 'WW',
        logoUrl: (m as any).leagueLogoUrl ?? null,
        leagueSlug: (m as any).leagueSlug ?? '',
        priority: getLeaguePriority(name),
      });
    }
    groups.get(id)!.matches.push(m);
  }
  return [...groups.entries()].sort((a, b) => {
    const pa = a[1].priority, pb = b[1].priority;
    // دوريات معروفة أولاً
    if (pa !== pb) return pa - pb;
    // نفس الأولوية: الأكثر مباريات أولاً
    const md = b[1].matches.length - a[1].matches.length;
    if (md !== 0) return md;
    // نفس العدد: alphabetical
    return a[1].name.localeCompare(b[1].name);
  });
}

function Section({ title, color, dot, items }: { title: string; color: string; dot?: boolean; items: MatchSummary[] }) {
  if (items.length === 0) return null;
  const groups = groupByLeague(items);
  return (
    <div style={{ marginBottom: 6 }}>
      <div className="section-header">
        {dot && <span className="live-dot" style={{ flexShrink: 0 }} />}
        {!dot && <span className="section-header__bar" style={{ background: color }} />}
        <span className="section-header__title" style={{ color }}>{title}</span>
        <span className="section-header__count" style={{ color, background: `${color}18` }}>{items.length}</span>
      </div>
      {groups.map(([leagueId, group]) => (
        <MatchGroup
          key={leagueId}
          label={group.name}
          flag={countryFlag(group.countryCode)}
          logoUrl={group.logoUrl}
          count={group.matches.length}
          leagueSlug={group.leagueSlug}
        >
          {group.matches.map(match => (
            <MatchRow key={match.id} match={match} />
          ))}
        </MatchGroup>
      ))}
    </div>
  );
}

function buildDateStrip() {
  const today = new Date();
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function fmtStripDay(d: Date) {
  if (d.toDateString() === new Date().toDateString()) return 'Today';
  return d.toLocaleDateString('en-GB', { weekday: 'short' });
}

function fmtIso(d: Date) {
  return d.toISOString().split('T')[0];
}

const TOP_LEAGUE_LINKS = [
  { name: 'UCL',        slug: 'uefa-champions-league-2025-2026', flag: '🇪🇺' },
  { name: 'EPL',        slug: 'premier-league-2025-2026',        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'La Liga',    slug: 'la-liga-2025-2026',               flag: '🇪🇸' },
  { name: 'Serie A',    slug: 'serie-a-2025-2026',               flag: '🇮🇹' },
  { name: 'Bundesliga', slug: 'bundesliga-2025-2026',            flag: '🇩🇪' },
  { name: 'Ligue 1',    slug: 'ligue-1-2025-2026',               flag: '🇫🇷' },
  { name: 'Saudi PL',   slug: 'saudi-pro-league-2025-2026',      flag: '🇸🇦' },
  { name: 'Europa',     slug: 'europa-league-2025-2026',         flag: '🇪🇺' },
];

export default async function HomePage() {
  let matches: MatchSummary[] = [];
  let error: string | null = null;
  try {
    matches = await getTodayMatches();
  } catch {
    error = "Could not load today's matches.";
  }

  const live     = matches.filter(m => isLive(m.status));
  const finished = matches.filter(m => isFinished(m.status));
  const upcoming = matches.filter(m => !isLive(m.status) && !isFinished(m.status));
  const today    = formatDate(new Date());
  const dateStrip = buildDateStrip();
  const todayIso  = fmtIso(new Date());

  return (
    <>
      {/* Date Strip */}
      <div className="date-strip">
        <div className="date-strip__inner">
          {dateStrip.map((d) => {
            const iso = fmtIso(d);
            const isToday = iso === todayIso;
            return (
              <a key={iso} href={isToday ? '/' : `/?date=${iso}`} className={`date-pill${isToday ? ' active' : ''}`}>
                <span className="date-pill__day">{fmtStripDay(d)}</span>
                <span className="date-pill__num">{d.getDate()}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Top Leagues Quick Bar */}
      <div className="top-leagues-bar">
        <div className="top-leagues-bar__inner">
          <span className="top-leagues-bar__label">TOP</span>
          {TOP_LEAGUE_LINKS.map((l) => (
            <a key={l.slug} href={`/leagues/${l.slug}`} className="top-league-pill">
              <span>{l.flag}</span>
              <span className="top-league-pill__name">{l.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Main + Sidebar layout */}
      <div className="home-layout">
        <div className="home-main">
          <div className="home-hero">
            <div>
              <h1 className="home-hero__title">TODAY&apos;S MATCHES</h1>
              <p className="home-hero__date">{today}</p>
            </div>
            {matches.length > 0 && (
              <div className="stats-bar">
                <StatChip label="Live"     value={live.length}     color="var(--green)"      pulse={live.length > 0} />
                <div className="stats-bar__divider" />
                <StatChip label="Upcoming" value={upcoming.length} color="var(--text-muted)" />
                <div className="stats-bar__divider" />
                <StatChip label="Finished" value={finished.length} color="var(--text-dim)" />
                <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.05em', alignSelf: 'center' }}>
                  {matches.length} TOTAL
                </div>
              </div>
            )}
          </div>

          {error && <ErrorBanner message={error} />}
          {matches.length === 0 && !error ? (
            <EmptyState message="No matches scheduled for today." />
          ) : (
            <>
              <Section title="Live Now" color="var(--green)"      dot  items={live} />
              <Section title="Upcoming" color="var(--blue-bright)"     items={upcoming} />
              <Section title="Finished" color="var(--text-muted)"      items={finished} />
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="home-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-card__title">TOP LEAGUES</div>
            <div className="sidebar-league-list">
              {TOP_LEAGUE_LINKS.map((l) => (
                <a key={l.slug} href={`/leagues/${l.slug}`} className="sidebar-league-item">
                  <span>{l.flag}</span>
                  <span className="sidebar-league-item__name">{l.name}</span>
                  <span className="sidebar-league-item__arrow">›</span>
                </a>
              ))}
            </div>
            <a href="/leagues" className="sidebar-card__more">All Leagues →</a>
          </div>
          {live.length > 0 && (
            <div className="sidebar-card" style={{ marginTop: 10 }}>
              <div className="sidebar-card__title" style={{ color: 'var(--green)' }}>
                <span className="live-dot" style={{ marginRight: 6 }} />LIVE NOW
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '6px 0' }}>
                {live.length} match{live.length !== 1 ? 'es' : ''} in progress
              </div>
              <a href="/live" className="sidebar-card__more" style={{ color: 'var(--green)' }}>View All Live →</a>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function StatChip({ label, value, color, pulse }: { label: string; value: number; color: string; pulse?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {pulse && value > 0 && <span className="live-dot" />}
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '0.02em', color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.07em', textTransform: 'uppercase' as const, lineHeight: 1 }}>{label}</span>
    </div>
  );
}
