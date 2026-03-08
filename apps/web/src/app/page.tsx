import type { Metadata } from 'next';
import { getTodayMatches } from '@/lib/api';
import { formatDate, countryFlag, isLive, isFinished } from '@/lib/utils';
import { MatchRow, MatchGroup, EmptyState, ErrorBanner } from '@/components/ui';
import type { MatchSummary } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: "Today's Football — WatchKickoff",
  description: "Live scores and results for today's football matches.",
};

export const revalidate = 60;

function groupByLeague(matches: MatchSummary[]) {
  const groups = new Map<string, { matches: MatchSummary[]; name: string; countryCode: string }>();
  for (const m of matches) {
    const id = m.leagueId;
    if (!groups.has(id)) {
      groups.set(id, {
        matches: [],
        name: (m as any).leagueName ?? `League · ${id.slice(0, 8)}`,
        countryCode: (m as any).leagueCountryCode ?? 'WW',
      });
    }
    groups.get(id)!.matches.push(m);
  }
  return groups;
}

export default async function HomePage() {
  let matches: MatchSummary[] = [];
  let error: string | null = null;

  try {
    matches = await getTodayMatches();
  } catch {
    error = "Could not load today's matches.";
  }

  const live      = matches.filter(m => isLive(m.status));
  const finished  = matches.filter(m => isFinished(m.status));
  const upcoming  = matches.filter(m => !isLive(m.status) && !isFinished(m.status));

  const today = formatDate(new Date());

  const Section = ({ title, accent, items }: {
    title: string; accent: string; items: MatchSummary[]
  }) => {
    if (items.length === 0) return null;
    const groups = groupByLeague(items);
    return (
      <div style={{ marginBottom: 36 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
        }}>
          <span style={{
            width: 3, height: 20, borderRadius: 2,
            background: accent, display: 'inline-block',
          }} />
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: accent,
            margin: 0,
          }}>{title}</h2>
          <span style={{
            fontSize: 12, fontWeight: 600, color: accent,
            background: `${accent}18`, borderRadius: 4,
            padding: '1px 7px', fontFamily: 'var(--font-display)',
          }}>{items.length}</span>
        </div>
        {[...groups.entries()].map(([leagueId, group]) => (
          <MatchGroup
            key={leagueId}
            label={group.name}
            flag={countryFlag(group.countryCode)}
          >
            {group.matches.map(match => (
              <MatchRow key={match.id} match={match} />
            ))}
          </MatchGroup>
        ))}
      </div>
    );
  };

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
          letterSpacing: '0.03em', lineHeight: 1.1, margin: 0,
        }}>Today&apos;s Matches</h1>
        <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 14 }}>{today}</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {matches.length === 0 && !error ? (
        <EmptyState message="No matches scheduled for today." />
      ) : (
        <>
          <Section title="Live Now"  accent="var(--green)" items={live} />
          <Section title="Upcoming"  accent="var(--text-muted)" items={upcoming} />
          <Section title="Finished"  accent="var(--text-dim)" items={finished} />
        </>
      )}
    </div>
  );
}
