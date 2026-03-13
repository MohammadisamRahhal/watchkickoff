import type { Metadata } from 'next';
import { getTodayMatches, getMatchesByDate } from '@/lib/api';
import { countryFlag, isLive, isFinished } from '@/lib/utils';
import { MatchRow, MatchGroup, EmptyState, ErrorBanner } from '@/components/ui';
import type { MatchSummary } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: "Today's Football Scores & Results — WatchKickoff",
  description: "Live scores, fixtures and results from 500+ leagues worldwide.",
};

export const dynamic = 'force-dynamic';

const TOP_LEAGUE_NAMES = ['UEFA Champions League','Premier League','La Liga','Serie A','Bundesliga','Ligue 1','UEFA Europa League','UEFA Conference League','FA Cup','Copa del Rey','DFB Pokal','Coppa Italia','Saudi Pro League','AFC Champions League','World Cup','Euro','Nations League','MLS','Eredivisie','Primeira Liga'];

function getLeaguePriority(name: string): number {
  const n = name.toLowerCase();
  for (let i = 0; i < TOP_LEAGUE_NAMES.length; i++) { if (n.includes(TOP_LEAGUE_NAMES[i].toLowerCase())) return i; }
  return TOP_LEAGUE_NAMES.length;
}

function groupByLeague(matches: MatchSummary[]) {
  const groups = new Map<string, { matches: MatchSummary[]; name: string; countryCode: string; logoUrl: string | null; leagueSlug: string; priority: number; }>();
  for (const m of matches) {
    const id = m.leagueId;
    if (!groups.has(id)) {
      const name = (m as any).leagueName ?? `League ${id.slice(0, 6)}`;
      groups.set(id, { matches: [], name, countryCode: (m as any).leagueCountryCode ?? 'WW', logoUrl: (m as any).leagueLogoUrl ?? null, leagueSlug: (m as any).leagueSlug ?? '', priority: getLeaguePriority(name) });
    }
    groups.get(id)!.matches.push(m);
  }
  return [...groups.entries()].sort((a, b) => { const pa = a[1].priority, pb = b[1].priority; if (pa !== pb) return pa - pb; const md = b[1].matches.length - a[1].matches.length; if (md !== 0) return md; return a[1].name.localeCompare(b[1].name); });
}

function Section({ title, color, dot, items }: { title: string; color: string; dot?: boolean; items: MatchSummary[]; }) {
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
        <MatchGroup key={leagueId} label={group.name} flag={countryFlag(group.countryCode)} logoUrl={group.logoUrl} count={group.matches.length} leagueSlug={group.leagueSlug}>
          {group.matches.map(match => <MatchRow key={match.id} match={match} />)}
        </MatchGroup>
      ))}
    </div>
  );
}

function fmtIso(d: Date) { return d.toISOString().split('T')[0]; }

function fmtStripDay(d: Date, todayIso: string) {
  const iso = fmtIso(d);
  if (iso === todayIso) return 'Today';
  const t = new Date(); t.setDate(t.getDate() + 1);
  if (iso === fmtIso(t)) return 'Tomorrow';
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (iso === fmtIso(y)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short' });
}

function StatChip({ label, value, color, pulse }: { label: string; value: number; color: string; pulse?: boolean; }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {pulse && value > 0 && <span className="live-dot" />}
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.07em', textTransform: 'uppercase' as const, lineHeight: 1 }}>{label}</span>
    </div>
  );
}

const TOP_LEAGUE_LINKS = [
  { name: 'UCL', slug: 'uefa-champions-league-2025-2026', flag: '🇪🇺' },
  { name: 'EPL', slug: 'premier-league-2025-2026', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'La Liga', slug: 'la-liga-2025-2026', flag: '🇪🇸' },
  { name: 'Serie A', slug: 'serie-a-2025-2026', flag: '🇮🇹' },
  { name: 'Bundesliga', slug: 'bundesliga-2025-2026', flag: '🇩🇪' },
  { name: 'Ligue 1', slug: 'ligue-1-2025-2026', flag: '🇫🇷' },
  { name: 'Saudi PL', slug: 'saudi-pro-league-2025-2026', flag: '🇸🇦' },
  { name: 'Europa', slug: 'europa-league-2025-2026', flag: '🇪🇺' },
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
  } catch { error = `Could not load matches for ${activeDate}.`; }

  const live = matches.filter(m => isLive(m.status));
  const finished = matches.filter(m => isFinished(m.status));
  const upcoming = matches.filter(m => !isLive(m.status) && !isFinished(m.status));

  const displayDate = new Date(activeDate + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dateStrip: Date[] = [];
  for (let i = -3; i <= 3; i++) { const d = new Date(); d.setDate(d.getDate() + i); dateStrip.push(d); }

  return (
    <>
      <div className="date-strip">
        <div className="date-strip__inner">
          {dateStrip.map((d) => {
            const iso = fmtIso(d);
            const isActive = iso === activeDate;
            const href = iso === todayIso ? '/' : `/?date=${iso}`;
            return (
              <a key={iso} href={href} className={`date-pill${isActive ? ' active' : ''}`}>
                <span className="date-pill__day">{fmtStripDay(d, todayIso)}</span>
                <span className="date-pill__num">{d.getDate()}</span>
              </a>
            );
          })}
        </div>
      </div>

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

      <div className="home-layout">
        <div className="home-main">
          <div className="home-hero">
            <div>
              <h1 className="home-hero__title">{isToday ? "TODAY'S MATCHES" : displayDate.toUpperCase()}</h1>
              <p className="home-hero__date">{displayDate}</p>
            </div>
            {matches.length > 0 && (
              <div className="stats-bar">
                <StatChip label="Live" value={live.length} color="var(--green)" pulse={live.length > 0} />
                <div className="stats-bar__divider" />
                <StatChip label="Upcoming" value={upcoming.length} color="var(--text-muted)" />
                <div className="stats-bar__divider" />
                <StatChip label="Finished" value={finished.length} color="var(--text-dim)" />
                <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.05em', alignSelf: 'center' }}>{matches.length} TOTAL</div>
              </div>
            )}
          </div>

          {error && <ErrorBanner message={error} />}
          {matches.length === 0 && !error
            ? <EmptyState message={`No matches scheduled for ${displayDate}.`} />
            : <>
                <Section title="Live Now" color="var(--green)" dot items={live} />
                <Section title="Upcoming" color="var(--blue-bright)" items={upcoming} />
                <Section title="Finished" color="var(--text-muted)" items={finished} />
              </>
          }
        </div>

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
          {isToday && live.length > 0 && (
            <div className="sidebar-card" style={{ marginTop: 10 }}>
              <div className="sidebar-card__title" style={{ color: 'var(--green)' }}>
                <span className="live-dot" style={{ marginRight: 6 }} />LIVE NOW
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '6px 0' }}>{live.length} match{live.length !== 1 ? 'es' : ''} in progress</div>
              <a href="/live" className="sidebar-card__more" style={{ color: 'var(--green)' }}>View All Live →</a>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
