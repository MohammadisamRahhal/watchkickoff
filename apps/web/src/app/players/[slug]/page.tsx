import type { Metadata } from 'next';
import { getPlayerBySlug, getPlayerStats } from '@/lib/api';
import { ErrorBanner, EmptyState, TeamCrest } from '@/components/ui';
import { countryFlag } from '@/lib/utils';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const player = await getPlayerBySlug(slug);
    return { title: player.name, description: `Stats and career info for ${player.name}.` };
  } catch { return { title: 'Player' }; }
}

export const revalidate = 900;

const POSITION_LABEL: Record<string, string> = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' };

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params;
  let player: any = null;
  let stats: any[] = [];
  let error: string | null = null;

  try {
    [player, stats] = await Promise.all([
      getPlayerBySlug(slug),
      getPlayerStats(slug),
    ]);
  } catch { error = 'Player not found.'; }

  if (error || !player) return (
    <div className="container" style={{ paddingTop: 28 }}>
      <ErrorBanner message={error ?? 'Unknown error.'} />
    </div>
  );

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>

      <nav className="breadcrumb">
        <a href="/">Today</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>{player.name}</span>
      </nav>

      {/* Player header */}
      <div className="match-hero" style={{ marginBottom: 20, padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Avatar placeholder */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, flexShrink: 0,
          }}>
            {player.position === 'GK' ? '🧤' : player.position === 'DEF' ? '🛡' : player.position === 'FWD' ? '⚽' : '🎯'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1 }}>
              {player.name.toUpperCase()}
            </h1>
            <div style={{ marginTop: 6, display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: 13, flexWrap: 'wrap' }}>
              {player.position && <span style={{ color: 'var(--green)', fontWeight: 600 }}>{POSITION_LABEL[player.position] ?? player.position}</span>}
              {player.nationalityCode && <span>{countryFlag(player.nationalityCode)} {player.nationalityCode}</span>}
              {age && <span>Age {age}</span>}
              {player.heightCm && <span>{player.heightCm} cm</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Season stats */}
      {stats.length === 0 ? (
        <EmptyState message="No stats available for this player yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 4 }}>
            SEASON STATISTICS
          </h2>
          {stats.map((s: any, i: number) => (
            <div key={i} className="card">
              <div className="card__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TeamCrest url={s.team_crest} name={s.team_name} size={24} />
                  <div>
                    <a href={`/teams/${s.team_slug}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{s.team_name}</a>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 8 }}>
                      <a href={`/leagues/${s.league_slug}`} style={{ color: 'var(--text-dim)' }}>
                        {countryFlag(s.country_code)} {s.league_name}
                      </a>
                    </span>
                  </div>
                </div>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{s.season}</span>
              </div>
              <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, textAlign: 'center' }}>
                {[
                  { label: 'Apps',    value: s.appearances },
                  { label: 'Goals',   value: s.goals,   highlight: true },
                  { label: 'Assists', value: s.assists },
                  { label: 'Mins',    value: s.minutes_played },
                  { label: '🟨',     value: s.yellow_cards },
                  { label: '🟥',     value: s.red_cards },
                ].map(({ label, value, highlight }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: highlight ? 'var(--green)' : 'var(--text)' }}>
                      {value ?? 0}
                    </div>
                  </div>
                ))}
              </div>
              {s.rating && (
                <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Rating</span>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                    color: parseFloat(s.rating) >= 7 ? 'var(--green)' : 'var(--text)',
                    background: 'var(--bg-elevated)', padding: '2px 10px', borderRadius: 999,
                  }}>{parseFloat(s.rating).toFixed(1)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
