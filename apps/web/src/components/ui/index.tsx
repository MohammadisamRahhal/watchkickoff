/**
 * Shared UI primitives — all server-renderable (no 'use client').
 */
import type { MatchSummary } from '@watchkickoff/shared';
import { formatKickoff, statusLabel, isLive, isFinished, zoneClass } from '@/lib/utils';
import type { StandingRow } from '@watchkickoff/shared';
import Image from 'next/image';

// ── TeamCrest ─────────────────────────────────────────────────────

interface CrestProps {
  url: string | null;
  name: string;
  size?: number;
}

export function TeamCrest({ url, name, size = 24 }: CrestProps) {
  if (!url) {
    return (
      <div style={{
        width: size, height: size,
        borderRadius: '50%',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.45, color: 'var(--text-dim)',
        flexShrink: 0,
      }}>
        ⚽
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <Image
        src={url}
        alt={name}
        fill
        style={{ objectFit: 'contain' }}
        sizes={`${size}px`}
        unoptimized
      />
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────

export function StatusBadge({ match }: { match: MatchSummary }) {
  const live     = isLive(match.status);
  const finished = isFinished(match.status);
  const label    = statusLabel(match.status, match.minute);

  const style: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '2px 7px',
    borderRadius: 3,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    whiteSpace: 'nowrap',
  };

  if (live) {
    return (
      <span style={{ ...style, color: 'var(--green)', background: 'rgba(0,230,118,0.1)' }}>
        <span className="live-dot" />
        {label || 'LIVE'}
      </span>
    );
  }
  if (finished) {
    return <span style={{ ...style, color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>FT</span>;
  }
  if (label) {
    return <span style={{ ...style, color: 'var(--text-dim)', background: 'var(--bg-elevated)' }}>{label}</span>;
  }
  // Upcoming — show kickoff time
  return (
    <span style={{ ...style, color: 'var(--text-muted)', background: 'transparent', fontSize: 13 }}>
      {formatKickoff(match.kickoffAt)}
    </span>
  );
}

// ── MatchRow ──────────────────────────────────────────────────────

export function MatchRow({ match }: { match: MatchSummary }) {
  const live     = isLive(match.status);
  const finished = isFinished(match.status);
  const showScore = live || finished;

  return (
    <a
      href={`/matches/${match.slug}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background 0.12s',
        textDecoration: 'none',
        color: 'inherit',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* Home team */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15, fontWeight: 600,
          letterSpacing: '0.02em',
          textAlign: 'right',
          color: live ? 'var(--text)' : 'var(--text-muted)',
        }}>
          {match.homeTeam.shortName ?? match.homeTeam.name}
        </span>
        <TeamCrest url={match.homeTeam.crestUrl} name={match.homeTeam.name} size={22} />
      </div>

      {/* Score / status */}
      <div style={{ textAlign: 'center', minWidth: 80 }}>
        {showScore ? (
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20, fontWeight: 700,
            letterSpacing: '0.06em',
            color: live ? 'var(--green)' : 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            {match.homeScore}
            <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>–</span>
            {match.awayScore}
          </span>
        ) : null}
        <StatusBadge match={match} />
      </div>

      {/* Away team */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <TeamCrest url={match.awayTeam.crestUrl} name={match.awayTeam.name} size={22} />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15, fontWeight: 600,
          letterSpacing: '0.02em',
          color: live ? 'var(--text)' : 'var(--text-muted)',
        }}>
          {match.awayTeam.shortName ?? match.awayTeam.name}
        </span>
      </div>
    </a>
  );
}

// ── MatchGroup ────────────────────────────────────────────────────

interface MatchGroupProps {
  label: string;
  flag?: string;
  children: React.ReactNode;
}

export function MatchGroup({ label, flag, children }: MatchGroupProps) {
  return (
    <section style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-elevated)',
      }}>
        {flag && <span style={{ fontSize: 16 }}>{flag}</span>}
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12, fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      </div>
      {children}
    </section>
  );
}

// ── StandingsTable ─────────────────────────────────────────────────

interface StandingsTableProps {
  rows: StandingRow[];
  teamNames: Record<string, string>;   // teamId → name
  teamCrests: Record<string, string | null>;
}

export function StandingsTable({ rows, teamNames, teamCrests }: StandingsTableProps) {
  const th: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 11, fontWeight: 700,
    letterSpacing: '0.07em',
    color: 'var(--text-dim)',
    padding: '6px 8px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = {
    padding: '10px 8px',
    fontSize: 14,
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ ...th, textAlign: 'left', paddingLeft: 16, width: 36 }}>#</th>
            <th style={{ ...th, textAlign: 'left' }}>Team</th>
            <th style={th}>P</th>
            <th style={th}>W</th>
            <th style={th}>D</th>
            <th style={th}>L</th>
            <th style={th}>GD</th>
            <th style={{ ...th, color: 'var(--text)' }}>Pts</th>
            <th style={{ ...th, display: 'none' }}>Form</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={zoneClass(row.zone)}
              style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <td style={{ ...td, paddingLeft: 16, color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: 13 }}>
                {row.position}
              </td>
              <td style={{ ...td, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TeamCrest url={teamCrests[row.teamId] ?? null} name={teamNames[row.teamId] ?? ''} size={20} />
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {teamNames[row.teamId] ?? row.teamId}
                  </span>
                </div>
              </td>
              <td style={td}>{row.played}</td>
              <td style={td}>{row.wins}</td>
              <td style={td}>{row.draws}</td>
              <td style={td}>{row.losses}</td>
              <td style={{ ...td, color: row.goalDiff > 0 ? 'var(--green)' : row.goalDiff < 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </td>
              <td style={{ ...td, color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 15 }}>
                {row.points}
              </td>
              <td style={{ ...td, display: 'none' }}>
                {row.form ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────────────────

export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      color: 'var(--text-dim)',
      fontFamily: 'var(--font-display)',
      fontSize: 15,
      letterSpacing: '0.04em',
    }}>
      {message}
    </div>
  );
}

// ── ErrorBanner ────────────────────────────────────────────────────

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      padding: '12px 16px',
      background: 'rgba(255,23,68,0.08)',
      border: '1px solid rgba(255,23,68,0.25)',
      borderRadius: 'var(--radius)',
      color: 'var(--red)',
      fontSize: 14,
      marginBottom: 16,
    }}>
      {message}
    </div>
  );
}
