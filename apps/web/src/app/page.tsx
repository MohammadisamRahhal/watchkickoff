import type { Metadata } from 'next';
import { getTodayMatches } from '@/lib/api';
import { formatDate, countryFlag } from '@/lib/utils';
import { MatchRow, MatchGroup, EmptyState, ErrorBanner } from '@/components/ui';
import type { MatchSummary } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: "Today's Football",
  description: "Live scores and results for today's football matches.",
};

// ISR — revalidate every 60 seconds
export const revalidate = 60;

export default async function HomePage() {
  let matches: MatchSummary[] = [];
  let error: string | null = null;

  try {
    matches = await getTodayMatches();
  } catch {
    error = 'Could not load today\'s matches. The API may be starting up.';
  }

  // Group matches by leagueId
  const groups = new Map<string, MatchSummary[]>();
  const leagueNames = new Map<string, string>();
  for (const m of matches) {
    const existing = groups.get(m.leagueId) ?? [];
    existing.push(m);
    groups.set(m.leagueId, existing);
    if ((m as any).leagueName) leagueNames.set(m.leagueId, (m as any).leagueName);
  }

  const today = formatDate(new Date());

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28, fontWeight: 700,
          letterSpacing: '0.03em',
          lineHeight: 1.1,
        }}>
          Today&apos;s Matches
        </h1>
        <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 14 }}>{today}</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {matches.length === 0 && !error ? (
        <EmptyState message="No matches scheduled for today." />
      ) : (
        <div>
          {[...groups.entries()].map(([leagueId, leagueMatches]) => {
            const first = leagueMatches[0];
            // League name and flag not available in MatchSummary directly —
            // show league ID abbreviated; real impl would join league data
            const countryCode = 'GB'; // placeholder; populated when API returns league data
            void countryCode;

            return (
              <MatchGroup
                key={leagueId}
                label={leagueNames.get(leagueId) ?? `League · ${leagueId.slice(0, 8)}`}
                flag={first ? countryFlag('GB') : undefined}
              >
                {leagueMatches.map((match) => (
                  <MatchRow key={match.id} match={match} />
                ))}
              </MatchGroup>
            );
          })}
        </div>
      )}
    </div>
  );
}
