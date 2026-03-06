import type { Metadata } from 'next';
import { getLiveMatches } from '@/lib/api';
import { MatchRow, MatchGroup, EmptyState, ErrorBanner } from '@/components/ui';
import type { MatchSummary } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: 'Live Matches',
  description: 'Live football scores updating in real time.',
};

// Short revalidation — live data should be fresh
export const revalidate = 15;

export default async function LivePage() {
  let matches: MatchSummary[] = [];
  let error: string | null = null;

  try {
    matches = await getLiveMatches();
  } catch {
    error = 'Could not load live matches.';
  }

  // Group by leagueId
  const groups = new Map<string, MatchSummary[]>();
  for (const m of matches) {
    const existing = groups.get(m.leagueId) ?? [];
    existing.push(m);
    groups.set(m.leagueId, existing);
  }

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="live-dot" />
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28, fontWeight: 700,
          letterSpacing: '0.03em',
          lineHeight: 1.1,
          color: 'var(--green)',
        }}>
          Live Now
        </h1>
        {matches.length > 0 && (
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13, fontWeight: 700,
            color: 'var(--text-dim)',
            background: 'var(--bg-elevated)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
          }}>
            {matches.length} match{matches.length !== 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {matches.length === 0 && !error ? (
        <EmptyState message="No live matches right now. Check back on matchday." />
      ) : (
        <div>
          {[...groups.entries()].map(([leagueId, leagueMatches]) => (
            <MatchGroup key={leagueId} label={`League · ${leagueId.slice(0, 8)}`}>
              {leagueMatches.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </MatchGroup>
          ))}
        </div>
      )}

      <p style={{
        marginTop: 24,
        fontSize: 12,
        color: 'var(--text-dim)',
        textAlign: 'center',
      }}>
        Page refreshes every 15 seconds · Live updates via WebSocket in real-time
      </p>
    </div>
  );
}
