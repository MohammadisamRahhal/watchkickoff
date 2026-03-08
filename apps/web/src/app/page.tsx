import type { Metadata } from 'next';
import { getTodayMatches } from '@/lib/api';
import { formatDate, countryFlag, isLive, isFinished } from '@/lib/utils';
import { MatchRow, MatchGroup, EmptyState, ErrorBanner } from '@/components/ui';
import type { MatchSummary } from '@watchkickoff/shared';

export const metadata: Metadata = {
  title: "Today's Football Scores — WatchKickoff",
  description: "Live scores and results for today's football matches from 500+ leagues.",
};

export const revalidate = 60;

function groupByLeague(matches: MatchSummary[]) {
  const groups = new Map<string, { matches: MatchSummary[]; name: string; countryCode: string }>();
  for (const m of matches) {
    const id = m.leagueId;
    if (!groups.has(id)) {
      groups.set(id, {
        matches: [],
        name: (m as any).leagueName ?? `League ${id.slice(0, 6)}`,
        countryCode: (m as any).leagueCountryCode ?? 'WW',
      });
    }
    groups.get(id)!.matches.push(m);
  }
  return groups;
}

function Section({ title, color, items }: { title: string; color: string; items: MatchSummary[] }) {
  if (items.length === 0) return null;
  const groups = groupByLeague(items);
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="section-header">
        <span className="section-header__bar" style={{ background: color }} />
        <span className="section-header__title" style={{ color }}>{title}</span>
        <span className="section-header__count" style={{ color, background: `${color}18` }}>
          {items.length}
        </span>
      </div>
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
  );
}

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

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>

      {/* Page title */}
      <div style={{ marginBottom: 4, paddingTop: 4 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32, fontWeight: 600,
          letterSpacing: '0.04em',
          lineHeight: 1, margin: 0,
        }}>
          TODAY&apos;S MATCHES
        </h1>
        <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 14 }}>{today}</p>
      </div>

      {/* Stats bar */}
      {matches.length > 0 && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 8, marginTop: 16,
          padding: '10px 16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <StatChip label="Live" value={live.length} color="var(--green)" />
          <StatChip label="Upcoming" value={upcoming.length} color="var(--text-muted)" />
          <StatChip label="Finished" value={finished.length} color="var(--text-dim)" />
          <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.04em', alignSelf: 'center' }}>
            {matches.length} MATCHES
          </div>
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {matches.length === 0 && !error ? (
        <EmptyState message="No matches scheduled for today." />
      ) : (
        <>
          <Section title="Live Now"  color="var(--green)"      items={live} />
          <Section title="Upcoming"  color="var(--text-muted)" items={upcoming} />
          <Section title="Finished"  color="var(--text-dim)"   items={finished} />
        </>
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
        letterSpacing: '0.02em', color,
      }}>{value}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}
