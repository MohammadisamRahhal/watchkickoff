import type { Metadata } from 'next';
import { getTeamBySlug, getTeamMatches, getTeamStandings, getTeamSquad } from '@/lib/api';
import { MatchRow, MatchGroup, ErrorBanner, EmptyState, TeamCrest } from '@/components/ui';
import { countryFlag, isLive, isFinished, zoneClass } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const team = await getTeamBySlug(slug);
    return { title: team.name, description: `Fixtures, results and squad for ${team.name}.` };
  } catch { return { title: 'Team' }; }
}

export const revalidate = 300;

const POSITION_ORDER: Record<string, number> = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
const POSITION_LABEL: Record<string, string> = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' };

export default async function TeamPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab = 'matches' } = await searchParams;

  const [teamResult, matchesResult, standingsResult, squadResult] = await Promise.allSettled([
    getTeamBySlug(slug),
    getTeamMatches(slug),
    getTeamStandings(slug),
    getTeamSquad(slug),
  ]);

  const team      = teamResult.status      === 'fulfilled' ? teamResult.value      : null;
  const matches   = matchesResult.status   === 'fulfilled' ? matchesResult.value   : [];
  const standings = standingsResult.status === 'fulfilled' ? standingsResult.value : [];
  const squad     = squadResult.status     === 'fulfilled' ? squadResult.value     : [];

  if (!team) return <div className="container" style={{ paddingTop: 28 }}><ErrorBanner message="Team not found." /></div>;

  const live     = matches.filter((m: any) => isLive(m.status));
  const finished = matches.filter((m: any) => isFinished(m.status));
  const upcoming = matches.filter((m: any) => !isLive(m.status) && !isFinished(m.status));

  // Group squad by position
  const byPosition = new Map<string, any[]>();
  for (const p of squad) {
    const pos = p.position ?? 'MID';
    if (!byPosition.has(pos)) byPosition.set(pos, []);
    byPosition.get(pos)!.push(p);
  }
  const positionGroups = [...byPosition.entries()].sort((a, b) => (POSITION_ORDER[a[0]] ?? 9) - (POSITION_ORDER[b[0]] ?? 9));

  const tabs = [
    { id: 'matches',  label: 'MATCHES',  count: matches.length },
    { id: 'standings',label: 'STANDING', count: standings.length },
    { id: 'squad',    label: 'SQUAD',    count: squad.length },
  ];

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <a href="/">Today</a>
        <span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>{team.name}</span>
      </nav>

      {/* Team header */}
      <div className="match-hero" style={{ marginBottom: 20, padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <TeamCrest url={team.crestUrl} name={team.name} size={72} />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1 }}>
              {team.name.toUpperCase()}
            </h1>
            <div style={{ marginTop: 6, display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: 13, flexWrap: 'wrap' }}>
              {team.countryCode && <span>{countryFlag(team.countryCode)} {team.countryCode}</span>}
              {team.stadiumName && <span>🏟 {team.stadiumName}</span>}
              {team.foundedYear && <span>📅 Est. {team.foundedYear}</span>}
            </div>
          </div>
          {/* Current standing pill */}
          {standings[0] && (
            <div style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '12px 20px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--green)' }}>
                #{(standings[0] as any).position}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                {(standings[0] as any).league_name ?? 'League'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {tabs.map(({ id, label, count }) => (
          <a key={id} href={`/teams/${slug}?tab=${id}`} style={{
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.06em', padding: '10px 20px',
            color: tab === id ? 'var(--text)' : 'var(--text-dim)',
            borderBottom: tab === id ? '2px solid var(--green)' : '2px solid transparent',
            marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {label}
            {count > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: tab === id ? 'var(--green)' : 'var(--bg-elevated)',
                color: tab === id ? '#000' : 'var(--text-dim)',
                padding: '2px 6px', borderRadius: 999,
              }}>{count}</span>
            )}
          </a>
        ))}
      </div>

      {/* MATCHES TAB */}
      {tab === 'matches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {matches.length === 0 ? <EmptyState message="No matches found." /> : (
            <>
              {live.length > 0 && <MatchGroup label="Live Now" flag="🔴" count={live.length}>{live.map((m: any) => <MatchRow key={m.id} match={m} />)}</MatchGroup>}
              {upcoming.length > 0 && <MatchGroup label="Upcoming" flag="🗓" count={upcoming.length}>{upcoming.map((m: any) => <MatchRow key={m.id} match={m} />)}</MatchGroup>}
              {finished.length > 0 && <MatchGroup label="Results" flag="✓" count={finished.length}>{finished.map((m: any) => <MatchRow key={m.id} match={m} />)}</MatchGroup>}
            </>
          )}
        </div>
      )}

      {/* STANDINGS TAB */}
      {tab === 'standings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {standings.length === 0 ? <EmptyState message="No standings data available." /> : (
            standings.map((s: any) => (
              <div key={s.id} className="card">
                <div className="card__header">
                  <span className="card__title">{countryFlag(s.country_code)} {s.league_name}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{s.season}</span>
                </div>
                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center' }}>
                  {[
                    { label: 'POS', value: `#${s.position}`, highlight: true },
                    { label: 'P',   value: s.played },
                    { label: 'W',   value: s.wins },
                    { label: 'D',   value: s.draws },
                    { label: 'L',   value: s.losses },
                    { label: 'GD',  value: s.goals_for - s.goals_against > 0 ? `+${s.goals_for - s.goals_against}` : s.goals_for - s.goals_against },
                    { label: 'PTS', value: s.points, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: highlight ? 'var(--green)' : 'var(--text)' }}>{value}</div>
                    </div>
                  ))}
                </div>
                {s.form && (
                  <div style={{ padding: '0 16px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', marginRight: 4 }}>Form:</span>
                    {s.form.split('').map((r: string, i: number) => (
                      <span key={i} style={{
                        width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                        background: r === 'W' ? 'var(--green)' : r === 'L' ? 'var(--red)' : 'var(--bg-elevated)',
                        color: r === 'W' || r === 'L' ? '#000' : 'var(--text-muted)',
                      }}>{r}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* SQUAD TAB */}
      {tab === 'squad' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {squad.length === 0 ? <EmptyState message="Squad data not available yet." /> : (
            positionGroups.map(([pos, players]) => (
              <div key={pos} className="card">
                <div className="card__header">
                  <span className="card__title">{POSITION_LABEL[pos] ?? pos}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{players.length}</span>
                </div>
                <div>
                  {players.map((p: any, i: number) => (
                    <a key={p.id} href={`/players/${p.slug}`} style={{
                      display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                      alignItems: 'center', gap: 16,
                      padding: '10px 16px',
                      borderBottom: i < players.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }} className="match-row">
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                        {p.nationality_code && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{countryFlag(p.nationality_code)} {p.nationality_code}</div>}
                      </div>
                      {p.appearances > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Apps</div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{p.appearances}</div></div>}
                      {p.goals > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Goals</div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--green)' }}>{p.goals}</div></div>}
                      {p.assists > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Assists</div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{p.assists}</div></div>}
                    </a>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
