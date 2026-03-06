import type { Metadata } from 'next';
import { getMatchBySlug } from '@/lib/api';
import { TeamCrest, ErrorBanner } from '@/components/ui';
import { statusLabel, isLive, formatDate, formatKickoff } from '@/lib/utils';
import type { MatchEvent } from '@watchkickoff/shared';
import { EVENT_TYPE } from '@watchkickoff/shared';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const match = await getMatchBySlug(slug);
    const title = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    return {
      title,
      description: `${title} · ${match.league.name} · ${match.season}`,
    };
  } catch {
    return { title: 'Match' };
  }
}

export const revalidate = 30;

/** Map event type to a short glyph. */
function eventGlyph(type: MatchEvent['eventType']): string {
  switch (type) {
    case EVENT_TYPE.GOAL:           return '⚽';
    case EVENT_TYPE.OWN_GOAL:       return '⚽ OG';
    case EVENT_TYPE.PENALTY_SCORED: return '⚽ (P)';
    case EVENT_TYPE.PENALTY_MISSED: return '✗ (P)';
    case EVENT_TYPE.YELLOW:         return '🟨';
    case EVENT_TYPE.SECOND_YELLOW:  return '🟨🟥';
    case EVENT_TYPE.RED:            return '🟥';
    case EVENT_TYPE.SUB_IN:         return '↑';
    case EVENT_TYPE.SUB_OUT:        return '↓';
    case EVENT_TYPE.VAR:            return 'VAR';
    default:                        return '·';
  }
}

export default async function MatchPage({ params }: Props) {
  const { slug } = await params;
  let match = null;
  let error: string | null = null;

  try {
    match = await getMatchBySlug(slug);
  } catch {
    error = 'Match not found or could not be loaded.';
  }

  if (error || !match) {
    return (
      <div className="container" style={{ paddingTop: 28 }}>
        <ErrorBanner message={error ?? 'Unknown error.'} />
      </div>
    );
  }

  const live     = isLive(match.status);
  const statusTxt = statusLabel(match.status, match.minute);

  // Partition events by team
  const homeEvents = match.events.filter((e) => e.teamId === match!.homeTeamId);
  const awayEvents = match.events.filter((e) => e.teamId === match!.awayTeamId);

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20 }}>
        <a href="/leagues" style={{ color: 'var(--text-dim)' }}>Leagues</a>
        {' › '}
        <a href={`/leagues/${match.league.slug}`} style={{ color: 'var(--text-muted)' }}>
          {match.league.name}
        </a>
        {' › '}
        <span style={{ color: 'var(--text-muted)' }}>
          {match.homeTeam.shortName ?? match.homeTeam.name} vs {match.awayTeam.shortName ?? match.awayTeam.name}
        </span>
      </nav>

      {/* Score card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        {/* League strip */}
        <div style={{
          padding: '8px 20px',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border)',
          fontSize: 12,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{match.league.name}</span>
          <span>{match.round ?? match.season}</span>
        </div>

        {/* Main score area */}
        <div style={{
          padding: '32px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16,
        }}>
          {/* Home */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <TeamCrest url={match.homeTeam.crestUrl} name={match.homeTeam.name} size={52} />
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20, fontWeight: 700,
              letterSpacing: '0.03em',
            }}>
              {match.homeTeam.name}
            </div>
            {/* Home scoring events */}
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'right', lineHeight: 1.8 }}>
              {homeEvents
                .filter(e => ['GOAL','OWN_GOAL','PENALTY_SCORED'].includes(e.eventType))
                .map(e => (
                  <div key={e.id}>{eventGlyph(e.eventType)} {e.minute}&apos;</div>
                ))
              }
            </div>
          </div>

          {/* Score + status */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 52, fontWeight: 700,
              letterSpacing: '0.04em',
              color: live ? 'var(--green)' : 'var(--text)',
              lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {match.homeScore}
              <span style={{ color: 'var(--text-dim)', fontWeight: 300 }}>–</span>
              {match.awayScore}
            </div>

            <div style={{ marginTop: 10 }}>
              {live && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                  <span className="live-dot" />
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16, fontWeight: 700,
                    color: 'var(--green)',
                    letterSpacing: '0.04em',
                  }}>
                    {statusTxt || 'LIVE'}
                  </span>
                </div>
              )}
              {!live && (
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13, fontWeight: 700,
                  color: 'var(--text-dim)',
                  letterSpacing: '0.06em',
                }}>
                  {statusTxt || `${formatDate(match.kickoffAt)} ${formatKickoff(match.kickoffAt)}`}
                </span>
              )}
            </div>

            {/* Half-time score */}
            {(match.homeScoreHt !== null || match.awayScoreHt !== null) && (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-dim)' }}>
                HT: {match.homeScoreHt ?? 0} – {match.awayScoreHt ?? 0}
              </div>
            )}
          </div>

          {/* Away */}
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
            <TeamCrest url={match.awayTeam.crestUrl} name={match.awayTeam.name} size={52} />
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20, fontWeight: 700,
              letterSpacing: '0.03em',
            }}>
              {match.awayTeam.name}
            </div>
            {/* Away scoring events */}
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              {awayEvents
                .filter(e => ['GOAL','OWN_GOAL','PENALTY_SCORED'].includes(e.eventType))
                .map(e => (
                  <div key={e.id}>{eventGlyph(e.eventType)} {e.minute}&apos;</div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Venue / meta strip */}
        {(match.venue) && (
          <div style={{
            padding: '8px 20px',
            borderTop: '1px solid var(--border)',
            fontSize: 12, color: 'var(--text-dim)',
            display: 'flex', gap: 16, justifyContent: 'center',
          }}>
            {match.venue && <span>🏟 {match.venue}</span>}
          </div>
        )}
      </div>

      {/* Events timeline */}
      {match.events.length > 0 && (
        <section>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16, fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            marginBottom: 12,
            textTransform: 'uppercase',
          }}>
            Match Events
          </h2>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}>
            {[...match.events]
              .sort((a, b) => a.minute - b.minute)
              .map((event) => {
                const isHome = event.teamId === match.homeTeamId;
                return (
                  <div key={event.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 48px 1fr',
                    alignItems: 'center',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: 14,
                  }}>
                    {isHome ? (
                      <div style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        <span style={{ marginRight: 6 }}>{eventGlyph(event.eventType)}</span>
                        {event.detail ?? event.eventType}
                      </div>
                    ) : <div />}

                    <div style={{
                      textAlign: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: 12, fontWeight: 700,
                      color: 'var(--text-dim)',
                    }}>
                      {event.minute}&apos;
                      {event.minuteExtra > 0 ? `+${event.minuteExtra}` : ''}
                    </div>

                    {!isHome ? (
                      <div style={{ color: 'var(--text-muted)' }}>
                        <span style={{ marginRight: 6 }}>{eventGlyph(event.eventType)}</span>
                        {event.detail ?? event.eventType}
                      </div>
                    ) : <div />}
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
}
