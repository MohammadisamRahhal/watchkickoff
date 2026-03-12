import type { MatchSummary, StandingRow } from '@watchkickoff/shared';
import { formatKickoff, statusLabel, isLive, isFinished, zoneClass } from '@/lib/utils';
import Image from 'next/image';

interface CrestProps { url: string | null; name: string; size?: number; }

export function TeamCrest({ url, name, size = 24 }: CrestProps) {
  if (!url) {
    return (
      <div className="match-row__crest-fallback" style={{ width: size, height: size, fontSize: size * 0.45 }}>⚽</div>
    );
  }
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <Image src={url} alt={name} fill style={{ objectFit: 'contain' }} sizes={`${size}px`} unoptimized />
    </div>
  );
}

export function StatusBadge({ match }: { match: MatchSummary }) {
  const live     = isLive(match.status);
  const finished = isFinished(match.status);
  const label    = statusLabel(match.status, match.minute);
  const isHT     = match.status === 'HALF_TIME';

  if (live && !isHT) return (
    <span className="status-badge live">
      <span className="live-dot" style={{ width: 5, height: 5 }} />{label || 'LIVE'}
    </span>
  );
  if (isHT)     return <span className="status-badge ht">HT</span>;
  if (finished) return <span className="status-badge finished">FT</span>;
  if (label)    return <span className="status-badge upcoming">{label}</span>;
  return <span className="status-badge upcoming">{formatKickoff(match.kickoffAt ?? '')}</span>;
}

export function MatchRow({ match }: { match: MatchSummary }) {
  const live      = isLive(match.status);
  const finished  = isFinished(match.status);
  const showScore = live || finished;

  return (
    <a href={`/matches/${match.slug}`} className={`match-row${live ? ' live' : ''}${finished ? ' finished' : ''}`}>
      <div className="match-row__home">
        <span className={`match-row__team-name${live || (finished && match.homeScore > match.awayScore) ? ' active' : ''}`}>
          {match.homeTeam.shortName ?? match.homeTeam.name}
        </span>
        <TeamCrest url={match.homeTeam.crestUrl} name={match.homeTeam.name} size={24} />
      </div>
      <div className="match-row__center">
        {showScore ? (
          <div className={`match-row__score${live ? ' live-score' : ''}`}>
            <span className={match.homeScore > match.awayScore ? 'score-winner' : ''}>{match.homeScore}</span>
            <span className="match-row__score-sep">–</span>
            <span className={match.awayScore > match.homeScore ? 'score-winner' : ''}>{match.awayScore}</span>
          </div>
        ) : null}
        <StatusBadge match={match} />
      </div>
      <div className="match-row__away">
        <TeamCrest url={match.awayTeam.crestUrl} name={match.awayTeam.name} size={24} />
        <span className={`match-row__team-name${live || (finished && match.awayScore > match.homeScore) ? ' active' : ''}`}>
          {match.awayTeam.shortName ?? match.awayTeam.name}
        </span>
      </div>
    </a>
  );
}

export function MatchGroup({ label, flag, logoUrl, count, leagueSlug, children }: {
  label: string; flag?: string; logoUrl?: string | null;
  count?: number; leagueSlug?: string; children: React.ReactNode;
}) {
  const headerContent = (
    <div className="league-group__header">
      {logoUrl ? (
        <div style={{ width: 20, height: 20, position: 'relative', flexShrink: 0 }}>
          <Image src={logoUrl} alt={label} fill style={{ objectFit: 'contain' }} sizes="20px" unoptimized />
        </div>
      ) : (
        flag && <span className="league-group__flag">{flag}</span>
      )}
      <span className="league-group__name">{label}</span>
      {count != null && <span className="league-group__count">{count} matches</span>}
      {leagueSlug && <span className="league-group__link-arrow">›</span>}
    </div>
  );
  return (
    <div className="league-group">
      {leagueSlug ? (
        <a href={`/leagues/${leagueSlug}`} style={{ display: 'block', textDecoration: 'none' }}>{headerContent}</a>
      ) : headerContent}
      {children}
    </div>
  );
}

export function StandingsTable({ rows, teamNames, teamCrests, teamSlugs }: {
  rows: StandingRow[];
  teamNames: Record<string, string>;
  teamCrests: Record<string, string | null>;
  teamSlugs?: Record<string, string>;
}) {
  return (
    <div className="standings-wrap">
      <table className="standings-table">
        <thead>
          <tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
        </thead>
        <tbody>
          {[...rows].sort((a, b) => a.position - b.position).map((row) => (
            <tr key={row.id} className={`standing-row ${zoneClass(row.zone)}`}>
              <td>{row.position}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TeamCrest url={teamCrests[row.teamId] ?? null} name={teamNames[row.teamId] ?? ''} size={20} />
                  {teamSlugs?.[row.teamId]
                    ? <a href={'/teams/' + teamSlugs[row.teamId]} style={{ color: 'var(--text)', fontWeight: 500, textDecoration: 'none' }}>{teamNames[row.teamId] ?? row.teamId}</a>
                    : <span style={{ color: 'var(--text)', fontWeight: 500 }}>{teamNames[row.teamId] ?? row.teamId}</span>}
                </div>
              </td>
              <td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td>
              <td style={{ color: row.goalDiff > 0 ? 'var(--green)' : row.goalDiff < 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </td>
              <td style={{ fontWeight: 600 }}>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">⚽</div>
      <div className="empty-state__text">{message}</div>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return <div className="error-banner">{message}</div>;
}
