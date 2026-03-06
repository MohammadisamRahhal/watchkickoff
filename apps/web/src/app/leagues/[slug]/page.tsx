import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueMatches, getStandings } from '@/lib/api';
import { MatchRow, MatchGroup, StandingsTable, ErrorBanner, EmptyState, TeamCrest } from '@/components/ui';
import { countryFlag } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const league = await getLeagueBySlug(slug);
    return {
      title: league.name,
      description: `Fixtures, results and standings for ${league.name} ${league.season}.`,
    };
  } catch {
    return { title: 'League' };
  }
}

export const revalidate = 300;

export default async function LeaguePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab = 'fixtures' } = await searchParams;

  let leagueError: string | null = null;
  let matchesError: string | null = null;
  let standingsError: string | null = null;

  const [leagueResult, matchesResult, standingsResult] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueMatches(slug),
    getStandings(slug),
  ]);

  const league   = leagueResult.status   === 'fulfilled' ? leagueResult.value   : null;
  const matches  = matchesResult.status  === 'fulfilled' ? matchesResult.value  : [];
  const standings = standingsResult.status === 'fulfilled' ? standingsResult.value : [];

  if (!league) leagueError = 'League not found.';
  if (matchesResult.status === 'rejected') matchesError = 'Could not load fixtures.';
  if (standingsResult.status === 'rejected') standingsError = 'Could not load standings.';

  // Build teamId lookup maps from matches for the standings table
  const teamNames:  Record<string, string>       = {};
  const teamCrests: Record<string, string | null> = {};
  for (const m of matches) {
    teamNames[m.homeTeamId]  = m.homeTeam.name;
    teamNames[m.awayTeamId]  = m.awayTeam.name;
    teamCrests[m.homeTeamId] = m.homeTeam.crestUrl;
    teamCrests[m.awayTeamId] = m.awayTeam.crestUrl;
  }

  const tabs = [
    { id: 'fixtures',  label: 'Fixtures' },
    { id: 'standings', label: 'Standings' },
  ];

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
      {leagueError ? (
        <ErrorBanner message={leagueError} />
      ) : league ? (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>{countryFlag(league.countryCode)}</span>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28, fontWeight: 700,
              letterSpacing: '0.03em',
            }}>
              {league.name}
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {league.season} · {league.type}
          </p>
        </div>
      ) : null}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 2,
        borderBottom: '1px solid var(--border)',
        marginBottom: 20,
      }}>
        {tabs.map(({ id, label }) => (
          <a
            key={id}
            href={`/leagues/${slug}?tab=${id}`}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13, fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '8px 16px',
              color: tab === id ? 'var(--text)' : 'var(--text-dim)',
              borderBottom: tab === id ? '2px solid var(--green)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.12s',
            }}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Fixtures tab */}
      {tab === 'fixtures' && (
        <div>
          {matchesError && <ErrorBanner message={matchesError} />}
          {matches.length === 0 && !matchesError ? (
            <EmptyState message="No fixtures available for this league." />
          ) : (
            <MatchGroup label={league?.name ?? slug}>
              {matches.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </MatchGroup>
          )}
        </div>
      )}

      {/* Standings tab */}
      {tab === 'standings' && (
        <div>
          {standingsError && <ErrorBanner message={standingsError} />}
          {standings.length === 0 && !standingsError ? (
            <EmptyState message="Standings not available yet." />
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
            }}>
              <StandingsTable
                rows={standings}
                teamNames={teamNames}
                teamCrests={teamCrests}
              />
            </div>
          )}

          {/* Zone legend */}
          {standings.length > 0 && (
            <div style={{
              marginTop: 12,
              display: 'flex', gap: 20, flexWrap: 'wrap',
              fontSize: 12, color: 'var(--text-muted)',
            }}>
              {[
                { cls: 'zone-promotion',    label: 'Promotion' },
                { cls: 'zone-championship', label: 'Playoff' },
                { cls: 'zone-relegation',   label: 'Relegation' },
              ].map(({ cls, label }) => (
                <span key={cls} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={cls} style={{ display: 'inline-block', width: 3, height: 14 }} />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
