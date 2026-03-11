import type { Metadata } from 'next';
import { getMatchBySlug, getMatchLineups } from '@/lib/api';
import { TeamCrest, ErrorBanner } from '@/components/ui';
import { statusLabel, isLive, isFinished, formatDate, formatKickoff, countryFlag } from '@/lib/utils';
import type { MatchEvent } from '@watchkickoff/shared';
import { EVENT_TYPE } from '@watchkickoff/shared';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const match = await getMatchBySlug(slug);
    const title = `${match.homeTeam.name} vs ${match.awayTeam.name} — ${match.league.name} | WatchKickoff`;
    const description = `${match.homeTeam.name} vs ${match.awayTeam.name} live score, events and lineups · ${match.league.name} ${match.season}.`;
    return { title, description };
  } catch { return { title: 'Match | WatchKickoff' }; }
}

export const revalidate = 30;

function eventGlyph(type: MatchEvent['eventType']): string {
  switch (type) {
    case EVENT_TYPE.GOAL:           return '⚽';
    case EVENT_TYPE.OWN_GOAL:       return '⚽';
    case EVENT_TYPE.PENALTY_SCORED: return '⚽';
    case EVENT_TYPE.PENALTY_MISSED: return '✗';
    case EVENT_TYPE.YELLOW:         return '🟨';
    case EVENT_TYPE.SECOND_YELLOW:  return '🟨🟥';
    case EVENT_TYPE.RED:            return '🟥';
    case EVENT_TYPE.SUB_IN:         return '↕';
    case EVENT_TYPE.VAR:            return 'VAR';
    default:                        return '·';
  }
}

function eventLabel(type: MatchEvent['eventType']): string {
  switch (type) {
    case EVENT_TYPE.OWN_GOAL:       return 'Own Goal';
    case EVENT_TYPE.PENALTY_SCORED: return 'Penalty';
    case EVENT_TYPE.PENALTY_MISSED: return 'Penalty Missed';
    case EVENT_TYPE.SUB_IN:         return 'Substitution';
    case EVENT_TYPE.VAR:            return 'VAR';
    default:                        return '';
  }
}

function isGoalEvent(type: string) {
  return [EVENT_TYPE.GOAL, EVENT_TYPE.OWN_GOAL, EVENT_TYPE.PENALTY_SCORED].includes(type as any);
}

export const dynamic = 'force-dynamic';

export default async function MatchPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab = 'events' } = await searchParams;
  let match = null;
  let lineups: any[] = [];
  let error: string | null = null;
  try {
    match = await getMatchBySlug(slug);
    try { lineups = await getMatchLineups(slug); } catch { lineups = []; }
  }
  catch { error = 'Match not found.'; }

  if (error || !match) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message={error ?? 'Unknown error.'} />
    </div>
  );

  const live      = isLive(match.status);
  const finished  = isFinished(match.status);
  const statusTxt = statusLabel(match.status, match.minute);
  const leagueFlag = countryFlag((match as any).leagueCountryCode ?? 'WW');
  const homeEvents = match.events.filter(e => e.teamId === match!.homeTeamId);
  const awayEvents = match.events.filter(e => e.teamId === match!.awayTeamId);
  const goalEvents = match.events.filter(e => isGoalEvent(e.eventType));

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <a href="/">Today</a>
        <span className="breadcrumb__sep">›</span>
        <a href={`/leagues/${match.league.slug}`}>{leagueFlag} {match.league.name}</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>
          {match.homeTeam.name} vs {match.awayTeam.name}
        </span>
      </nav>

      {/* Hero score card */}
      <div className="match-hero">

        {/* League strip */}
        <div className="match-hero__league">
          <span>{leagueFlag}</span>
          <span>{match.league.name}</span>
          {match.round && <span style={{ color: 'var(--text-dim)' }}>· {match.round}</span>}
          <span style={{ color: 'var(--text-dim)', marginLeft: 'auto' }}>{match.season}</span>
        </div>

        {/* Teams + Score */}
        <div className="match-hero__teams">

          {/* Home */}
          <div className="match-hero__team">
            <TeamCrest url={match.homeTeam.crestUrl} name={match.homeTeam.name} size={64} />
            <a href={"/teams/" + match.homeTeam.slug} className="match-hero__team-name" style={{textDecoration:'none',color:'inherit'}}>{match.homeTeam.name}</a>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.9 }}>
              {homeEvents.filter(e => isGoalEvent(e.eventType)).map(e => (
                <div key={e.id}>⚽ {(e as any).meta?.playerName ?? ''} {e.minute}'</div>
              ))}
            </div>
          </div>

          {/* Score block */}
          <div className="match-hero__score-block">
            {(live || finished) ? (
              <div className={`match-hero__score${live ? ' live-score' : ''}`}>
                <span>{match.homeScore}</span>
                <span className="match-hero__score-sep">–</span>
                <span>{match.awayScore}</span>
              </div>
            ) : (
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 32,
                color: 'var(--text-muted)', letterSpacing: '0.04em',
              }}>
                {formatKickoff(match.kickoffAt ?? "")}
              </div>
            )}

            <div style={{ marginTop: 10, textAlign: 'center' }}>
              {live && (
                <span className="status-badge live" style={{ fontSize: 14 }}>
                  <span className="live-dot" />
                  {statusTxt || 'LIVE'}
                </span>
              )}
              {finished && <span className="status-badge finished">Full Time</span>}
              {!live && !finished && (
                <span style={{ fontSize: 13, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                  {formatDate(match.kickoffAt ?? new Date().toISOString())}
                </span>
              )}
            </div>

            {(match.homeScoreHt != null || match.awayScoreHt != null) && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
                HT {match.homeScoreHt ?? 0} – {match.awayScoreHt ?? 0}
              </div>
            )}
          </div>

          {/* Away */}
          <div className="match-hero__team">
            <TeamCrest url={match.awayTeam.crestUrl} name={match.awayTeam.name} size={64} />
            <a href={"/teams/" + match.awayTeam.slug} className="match-hero__team-name" style={{textDecoration:'none',color:'inherit'}}>{match.awayTeam.name}</a>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.9 }}>
              {awayEvents.filter(e => isGoalEvent(e.eventType)).map(e => (
                <div key={e.id}>⚽ {(e as any).meta?.playerName ?? ''} {e.minute}'</div>
              ))}
            </div>
          </div>

        </div>

        {/* Venue */}
        {match.venue && (
          <div style={{
            marginTop: 20, paddingTop: 16,
            borderTop: '1px solid var(--border)',
            textAlign: 'center', fontSize: 13, color: 'var(--text-dim)',
          }}>
            🏟 {match.venue}
          </div>
        )}
      </div>

      {/* Tab nav */}
      {(live || finished) && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {[
            { id: 'events', label: 'EVENTS' },
            { id: 'lineup', label: 'LINEUP' },
          ].map(({ id, label }) => (
            <a key={id} href={`/matches/${slug}?tab=${id}`} style={{
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.06em', padding: '10px 20px',
              color: tab === id ? 'var(--text)' : 'var(--text-dim)',
              borderBottom: tab === id ? '2px solid var(--green)' : '2px solid transparent',
              marginBottom: -1,
            }}>{label}</a>
          ))}
        </div>
      )}

      {/* Events timeline */}
      {tab === 'events' && match.events.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card__header">
            <span className="card__title">Match Events</span>
            <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{match.events.length} events</span>
          </div>
          <div>
            {[...match.events]
              .sort((a, b) => a.minute - b.minute || (a.minuteExtra ?? 0) - (b.minuteExtra ?? 0))
              .map(event => {
                const isHome = event.teamId === match!.homeTeamId;
                const isGoal = isGoalEvent(event.eventType);
                return (
                  <div key={event.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 52px 1fr',
                    alignItems: 'center',
                    padding: '9px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isGoal ? 'rgba(0,230,118,0.03)' : 'transparent',
                  }}>
                    {isHome ? (
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: isGoal ? 'var(--text)' : 'var(--text-muted)' }}>
                            {(event as any).playerSlug
                              ? <a href={"/players/" + (event as any).playerSlug} style={{color:'inherit',textDecoration:'none'}}>{(event as any).meta?.playerName ?? event.detail ?? ''}</a>
                              : ((event as any).meta?.playerName ?? event.detail ?? '')}
                          </div>
                          {(event as any).meta?.assistName && (
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>↳ {(event as any).meta.assistName}</div>
                          )}
                          {eventLabel(event.eventType) && (
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{eventLabel(event.eventType)}</div>
                          )}
                        </div>
                        <span style={{ fontSize: 18 }}>{eventGlyph(event.eventType)}</span>
                      </div>
                    ) : <div />}

                    <div style={{
                      textAlign: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: 14, fontWeight: 600,
                      color: 'var(--text-dim)',
                      letterSpacing: '0.04em',
                    }}>
                      {event.minute}'
                      {(event.minuteExtra ?? 0) > 0 ? `+${event.minuteExtra}` : ''}
                    </div>

                    {!isHome ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{eventGlyph(event.eventType)}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: isGoal ? 'var(--text)' : 'var(--text-muted)' }}>
                            {(event as any).playerSlug
                              ? <a href={"/players/" + (event as any).playerSlug} style={{color:'inherit',textDecoration:'none'}}>{(event as any).meta?.playerName ?? event.detail ?? ''}</a>
                              : ((event as any).meta?.playerName ?? event.detail ?? '')}
                          </div>
                          {(event as any).meta?.assistName && (
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>↳ {(event as any).meta.assistName}</div>
                          )}
                          {eventLabel(event.eventType) && (
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{eventLabel(event.eventType)}</div>
                          )}
                        </div>
                      </div>
                    ) : <div />}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* No events placeholder */}
      {tab === 'events' && match.events.length === 0 && (live || finished) && (
        <div className="card">
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
            No events recorded yet
          </div>
        </div>
      )}


      {/* Lineup tab */}
      {tab === 'lineup' && (
        <div className="card">
          {lineups.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
              Lineup not available yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {/* Home team */}
              <div style={{ borderRight: '1px solid var(--border-subtle)', padding: '16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: 1 }}>
                  {match.homeTeam?.name?.toUpperCase()}
                </div>
                {lineups.filter((p: any) => p.team_id === match.homeTeam?.id).map((p: any) => (
                  <div key={p.player_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', minWidth: 20, textAlign: 'center' }}>{p.shirt_number ?? '—'}</span>
                    <a href={"/players/" + p.player_slug} style={{ fontSize: 13, color: p.is_starter ? 'var(--text)' : 'var(--text-muted)', fontWeight: p.is_starter ? 500 : 400, textDecoration:'none' }}>
                      {p.player_name}
                    </a>
                    {p.is_captain && <span style={{ fontSize: 10, color: 'var(--accent)' }}>©</span>}
                    {!p.is_starter && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>SUB</span>}
                  </div>
                ))}
              </div>
              {/* Away team */}
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: 1 }}>
                  {match.awayTeam?.name?.toUpperCase()}
                </div>
                {lineups.filter((p: any) => p.team_id === match.awayTeam?.id).map((p: any) => (
                  <div key={p.player_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', minWidth: 20, textAlign: 'center' }}>{p.shirt_number ?? '—'}</span>
                    <a href={"/players/" + p.player_slug} style={{ fontSize: 13, color: p.is_starter ? 'var(--text)' : 'var(--text-muted)', fontWeight: p.is_starter ? 500 : 400, textDecoration:'none' }}>
                      {p.player_name}
                    </a>
                    {p.is_captain && <span style={{ fontSize: 10, color: 'var(--accent)' }}>©</span>}
                    {!p.is_starter && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>SUB</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
