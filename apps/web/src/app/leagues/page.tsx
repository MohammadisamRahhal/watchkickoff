import type { Metadata } from 'next';
import { getLeagues } from '@/lib/api';
import { countryFlag } from '@/lib/utils';
import { EmptyState, ErrorBanner } from '@/components/ui';
import type { League } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: 'Leagues & Competitions',
  description: 'Browse football leagues, standings and fixtures from 500+ competitions worldwide.',
};

export const revalidate = 3600;

const FEATURED = ['39','140','135','78','61','2','3','848','307','188'];

export default async function LeaguesPage() {
  let leagues: League[] = [];
  let error: string | null = null;
  try { leagues = await getLeagues(); }
  catch { error = 'Could not load leagues.'; }

  if (error) return <div className="container" style={{ paddingTop: 28 }}><ErrorBanner message={error} /></div>;
  if (leagues.length === 0) return <div className="container" style={{ paddingTop: 28 }}><EmptyState message="No leagues available." /></div>;

  // Sort by country code
  const byCountry = new Map<string, League[]>();
  const sorted = [...leagues].sort((a, b) => a.countryCode.localeCompare(b.countryCode));
  for (const league of sorted) {
    const key = league.countryCode;
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key)!.push(league);
  }

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32,
          fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1,
        }}>LEAGUES</h1>
        <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 14 }}>
          {leagues.length} competitions across {byCountry.size} countries
        </p>
      </div>

      {/* Countries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Array.from(byCountry.entries()).map(([countryCode, countryLeagues]) => (
          <div key={countryCode} className="league-group">
            <div className="league-group__header">
              <span className="league-group__flag">{countryFlag(countryCode)}</span>
              <span className="league-group__name">{countryCode === 'WW' ? 'International' : countryCode}</span>
              <span className="league-group__count">{countryLeagues.length}</span>
            </div>
            <div>
              {countryLeagues.map((league, i) => (
                <a key={league.id} href={`/leagues/${league.slug}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom: i < countryLeagues.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.12s',
                  cursor: 'pointer',
                }} className="match-row">
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 14, fontWeight: 500,
                      color: 'var(--text)',
                    }}>{league.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                      {league.season} · {league.type}
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-dim)', fontSize: 16 }}>›</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
