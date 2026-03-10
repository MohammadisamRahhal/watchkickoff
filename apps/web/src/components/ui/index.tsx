/**
 * Shared UI primitives — server-renderable.
 */
import type { MatchSummary, StandingRow } from '@watchkickoff/shared';
import { formatKickoff, statusLabel, isLive, isFinished, zoneClass } from '@/lib/utils';
import Image from 'next/image';

// ── TeamCrest ─────────────────────────────────────────────────────
interface CrestProps { url: string | null; name: string; size?: number; }

export function TeamCrest({ url, name, size = 24 }: CrestProps) {
  if (!url) {
    return (
      <div className="match-row__crest-fallback" style={{ width: size, height: size, fontSize: size * 0.45 }}>
        ⚽
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <Image src={url} alt={name} fill style={{ objectFit: 'contain' }} sizes={`${size}px`} unoptimized />
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────
export function StatusBadge({ match }: { match: MatchSummary }) {
  const live     = isLive(match.status);
  const finished = isFinished(match.status);
  const label    = statusLabel(match.status, match.minute);
  const isHT     = match.status === 'HALF_TIME';

  if (live && !isHT) return (
    <span className="status-badge live">
      <span className="live-dot" />{label || 'LIVE'}
    </span>
  );
  if (isHT) return <span className="status-badge ht">HT</span>;
  if (finished) return <span className="status-badge finished">FT</span>;
  if (label) return <span className="status-badge upcoming">{label}</span>;
  return (
    <span className="status-badge upcoming">
      {formatKickoff(match.kickoffAt ?? "")}
    </span>
  );
}

// ── MatchRow ──────────────────────────────────────────────────────
export function MatchRow({ match }: { match: MatchSummary }) {
  const live     = isLive(match.status);
  const finished = isFinished(match.status);
  const showScore = live || finished;

  return (
    <a href={`/matches/${match.slug}`} className={`match-row${live ? ' live' : ''}`}>
      <div className="match-row__home">
        <a href={`/teams/${match.homeTeam.slug}`} className={`match-row__team-name${live ? ' active' : ''}`} style={{textDecoration:'none',color:'inherit'}}>
          {match.homeTeam.shortName ?? match.homeTeam.name}
        </a>
        <TeamCrest url={match.homeTeam.crestUrl} name={match.homeTeam.name} size={24} />
      </div>

      <div className="match-row__center">
        {showScore ? (
          <div className={`match-row__score${live ? ' live-score' : ''}`}>
            <span>{match.homeScore}</span>
            <span className="match-row__score-sep">–</span>
            <span>{match.awayScore}</span>
          </div>
        ) : null}
        <StatusBadge match={match} />
      </div>

      <div className="match-row__away">
        <TeamCrest url={match.awayTeam.crestUrl} name={match.awayTeam.name} size={24} />
        <a href={`/teams/${match.awayTeam.slug}`} className={`match-row__team-name${live ? ' active' : ''}`} style={{textDecoration:'none',color:'inherit'}}>
          {match.awayTeam.shortName ?? match.awayTeam.name}
        </a>
      </div>
    </a>
  );
}

// ── MatchGroup ────────────────────────────────────────────────────
export function MatchGroup({ label, flag, count, children }: {
  label: string; flag?: string; count?: number; children: React.ReactNode;
}) {
  return (
    <div className="league-group">
      <div className="league-group__header">
        {flag && <span className="league-group__flag">{flag}</span>}
        <span className="league-group__name">{label}</span>
        {count != null && <span className="league-group__count">{count}</span>}
      </div>
      {children}
    </div>
  );
}

// ── StandingsTable ─────────────────────────────────────────────────
export function StandingsTable({ rows, teamNames, teamCrests }: {
  rows: StandingRow[];
  teamNames: Record<string, string>;
  teamCrests: Record<string, string | null>;
}) {
  return (
    <div className="standings-wrap">
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={`standing-row ${zoneClass(row.zone)}`}>
              <td>{row.position}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TeamCrest url={teamCrests[row.teamId] ?? null} name={teamNames[row.teamId] ?? ''} size={20} />
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{teamNames[row.teamId] ?? row.teamId}</span>
                </div>
              </td>
              <td>{row.played}</td>
              <td>{row.wins}</td>
              <td>{row.draws}</td>
              <td>{row.losses}</td>
              <td style={{ color: row.goalDiff > 0 ? 'var(--green)' : row.goalDiff < 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </td>
              <td>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── EmptyState / ErrorBanner ──────────────────────────────────────
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
