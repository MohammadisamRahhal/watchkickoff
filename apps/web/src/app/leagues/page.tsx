import type { Metadata } from 'next';
import { getLeagues } from '@/lib/api';
import { countryFlag } from '@/lib/utils';
import { EmptyState, ErrorBanner } from '@/components/ui';
import type { League } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: 'Leagues',
  description: 'Browse football leagues, standings and fixtures.',
};

export const revalidate = 3600;

export default async function LeaguesPage() {
  let leagues: League[] = [];
  let error: string | null = null;

  try {
    leagues = await getLeagues();
  } catch {
    error = 'Could not load leagues.';
  }

  // Group by country code
  const byCountry = new Map<string, League[]>();
  for (const league of leagues) {
    const group = byCountry.get(league.countryCode) ?? [];
    group.push(league);
    byCountry.set(league.countryCode, group);
  }

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28, fontWeight: 700,
        letterSpacing: '0.03em',
        marginBottom: 24,
      }}>
        Leagues
      </h1>

      {error && <ErrorBanner message={error} />}

      {leagues.length === 0 && !error ? (
        <EmptyState message="No leagues available." />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {[...byCountry.entries()].map(([countryCode, countryLeagues]) => (
            <div key={countryCode}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 0 6px',
                borderBottom: '1px solid var(--border)',
                marginBottom: 4,
              }}>
                <span style={{ fontSize: 18 }}>{countryFlag(countryCode)}</span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                }}>
                  {countryCode}
                </span>
              </div>

              <div style={{ display: 'grid', gap: 2, marginBottom: 16 }}>
                {countryLeagues.map((league) => (
                  <a
                    key={league.id}
                    href={`/leagues/${league.slug}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'background 0.12s, border-color 0.12s',
                      color: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'var(--bg-elevated)';
                      el.style.borderColor = 'var(--text-dim)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'var(--bg-card)';
                      el.style.borderColor = 'var(--border)';
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 15, fontWeight: 600,
                        letterSpacing: '0.02em',
                      }}>
                        {league.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                        {league.season} · {league.type}
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontSize: 18 }}>›</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
