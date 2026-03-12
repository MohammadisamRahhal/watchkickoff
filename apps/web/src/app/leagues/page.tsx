import type { Metadata } from 'next';
import { getLeagues } from '@/lib/api';
import { countryFlag } from '@/lib/utils';
import { EmptyState, ErrorBanner } from '@/components/ui';
import type { League } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: 'Leagues & Competitions | WatchKickoff',
  description: 'Browse football leagues, standings and fixtures from 500+ competitions worldwide.',
};

export const dynamic = "force-dynamic";

// slugs الدوريات الكبيرة الحقيقية فقط
const TOP_LEAGUE_SLUGS = [
  'uefa-champions-league-2025-2026',
  'premier-league-2025-2026',
  'la-liga-2025-2026',
  'serie-a-2025-2026',
  'bundesliga-2025-2026',
  'ligue-1-2025-2026',
  'europa-league-2025-2026',
  'saudi-pro-league-2025-2026',
];
const TOP_LEAGUE_NAMES: string[] = [];

function getLeaguePriority(slug: string): number {
  const i = TOP_LEAGUE_SLUGS.indexOf(slug);
  return i === -1 ? 9999 : i;
}

function LeagueRow({ league, last }: { league: League; last: boolean }) {
  return (
    <a href={`/leagues/${league.slug}`} className="league-row-item" style={{
      borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
    }}>
      {(league as any).logo ? (
        <img src={(league as any).logo} alt={league.name} style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 24, height: 24, background: 'var(--bg-elevated)', borderRadius: 4, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {league.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
          {league.season ? `${Number(league.season)}-${Number(league.season) + 1}` : ''} · {(league.type ?? '').toUpperCase()}
        </div>
      </div>
      <span style={{ color: 'var(--text-dim)', fontSize: 16, flexShrink: 0 }}>›</span>
    </a>
  );
}

export default async function LeaguesPage() {
  let leagues: League[] = [];
  let error: string | null = null;
  try { leagues = await getLeagues(); }
  catch { error = 'Could not load leagues.'; }

  if (error) return <div className="leagues-page"><ErrorBanner message={error} /></div>;
  if (leagues.length === 0) return <div className="leagues-page"><EmptyState message="No leagues available." /></div>;

  const featured = leagues
    .filter(l => getLeaguePriority(l.slug) < 9999)
    .sort((a, b) => getLeaguePriority(a.slug) - getLeaguePriority(b.slug));

  const featuredIds = new Set(featured.map(l => l.id));
  const byCountry = new Map<string, League[]>();
  const rest = [...leagues].filter(l => !featuredIds.has(l.id)).sort((a, b) => (a.countryCode ?? "").localeCompare(b.countryCode ?? ""));
  for (const league of rest) {
    if (!byCountry.has(league.countryCode)) byCountry.set(league.countryCode, []);
    byCountry.get(league.countryCode)!.push(league);
  }

  return (
    <div className="leagues-page">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1 }}>LEAGUES</h1>
        <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 13 }}>
          {leagues.length} competitions · {byCountry.size + 1} countries
        </p>
      </div>

      {featured.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-header">
            <span className="section-header__bar" style={{ background: 'var(--green)' }} />
            <span className="section-header__title" style={{ color: 'var(--green)' }}>TOP LEAGUES</span>
          </div>
          <div className="league-group">
            {featured.map((league, i) => <LeagueRow key={league.id} league={league} last={i === featured.length - 1} />)}
          </div>
        </div>
      )}

      <div className="section-header">
        <span className="section-header__bar" style={{ background: 'var(--text-muted)' }} />
        <span className="section-header__title" style={{ color: 'var(--text-muted)' }}>ALL LEAGUES</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Array.from(byCountry.entries()).map(([code, list]) => (
          <div key={code} className="league-group">
            <div className="league-group__header">
              <span className="league-group__flag">{countryFlag(code)}</span>
              <span className="league-group__name">{code === 'WW' ? 'International' : code}</span>
              <span className="league-group__count">{list.length}</span>
            </div>
            {list.map((league, i) => <LeagueRow key={league.id} league={league} last={i === list.length - 1} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
