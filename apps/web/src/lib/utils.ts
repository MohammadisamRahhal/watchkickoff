import type { MatchStatus } from '@watchkickoff/shared';
import { LIVE_STATUSES, TERMINAL_STATUSES } from '@watchkickoff/shared';

/** Format a kickoff date/time for display. */
export function formatKickoff(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** Format a full date for display. */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Human-readable match status label. */
export function statusLabel(status: MatchStatus, minute?: number | null): string {
  if (LIVE_STATUSES.has(status)) {
    if (status === 'HALF_TIME') return 'HT';
    if (status === 'EXTRA_TIME') return `${minute ?? '?'}' ET`;
    if (status === 'PENALTIES') return 'PEN';
    return `${minute ?? '?'}'`;
  }
  if (status === 'FINISHED')  return 'FT';
  if (status === 'POSTPONED') return 'PPD';
  if (status === 'CANCELLED') return 'CANC';
  if (status === 'AWARDED')   return 'AWD';
  return '';
}

/** Whether a match is currently live. */
export function isLive(status: MatchStatus): boolean {
  return LIVE_STATUSES.has(status);
}

/** Whether a match has finished. */
export function isFinished(status: MatchStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/** Standing zone → CSS colour class. */
export function zoneClass(zone: string): string {
  switch (zone) {
    case 'PROMOTION':    return 'zone-promotion';
    case 'CHAMPIONSHIP': return 'zone-championship';
    case 'RELEGATION':   return 'zone-relegation';
    default:             return '';
  }
}

/** Country code → flag emoji. Works in all modern browsers. */
export function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}
