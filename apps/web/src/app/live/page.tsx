import type { Metadata } from 'next';
import { getLiveMatches } from '@/lib/api';
import { MatchRow, MatchGroup, EmptyState, ErrorBanner } from '@/components/ui';
import { countryFlag } from '@/lib/utils';
import type { MatchSummary } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: 'Live Football Scores — WatchKickoff',
  description: 'Live football scores updating in real time.',
};

export const revalidate = 15;

export default async function LivePage() {
  let matches: MatchSummary[] = [];
  let error: string | null = null;

  try {
    matches = await getLiveMatches();
  } catch {
    error = 'Could not load live matches.';
  }

  const groups = new Map<string, { matches: MatchSummary[]; name: string; countryCode: string }>();
  for (const m of matches) {
    const id = m.leagueId;
    if (!groups.has(id)) {
      groups.set(id, {
        matches: [],
        name: (m as any).leagueName ?? 'Unknown League',
        countryCode: (m as any).leagueCountryCode ?? 'WW',
      });
    }
    groups.get(id)!.matches.push(m);
  }

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span className="live-dot" />
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32, fontWeight: 600,
            letterSpacing: '0.04em', lineHeight: 1,
            color: 'var(--green)',
          }}>LIVE NOW</h1>
          {matches.length > 0 && (
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14, fontWeight: 600,
              color: 'var(--green)',
              background: 'var(--green-dim)',
              padding: '2px 10px',
              borderRadius: 20,
            }}>{matches.length}</span>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Updates every 15 seconds
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {matches.length === 0 && !error ? (
        <EmptyState message="No live matches right now — check back on matchday." />
      ) : (
        <div>
          {[...groups.entries()].map(([leagueId, group]) => (
            <MatchGroup
              key={leagueId}
              label={group.name}
              flag={countryFlag(group.countryCode)}
              count={group.matches.length}
            >
              {group.matches.map(match => (
                <MatchRow key={match.id} match={match} />
              ))}
            </MatchGroup>
          ))}
        </div>
      )}
    </div>
  );
}
