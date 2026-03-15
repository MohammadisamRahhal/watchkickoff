'use client';

function getResult(match: any, teamId: string): 'W' | 'D' | 'L' {
  const isHome = match.home_team_id === teamId;
  const gs = isHome ? match.home_score : match.away_score;
  const ga = isHome ? match.away_score : match.home_score;
  if (gs > ga) return 'W';
  if (gs < ga) return 'L';
  return 'D';
}

const RESULT_COLOR = { W: '#22c55e', D: '#f59e0b', L: '#ef4444' };

export default function TeamHero({ team, stats, form }: { team: any; stats: any; form: any[] }) {
  if (!team) return null;
  const formReversed = [...(form ?? [])].reverse();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e2235 0%, #252a3d 50%, #1a1d27 100%)',
      borderBottom: '1px solid #2a2d3a',
      padding: '32px 16px 24px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>
          <a href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 6px' }}>›</span>
          <a href="/leagues" style={{ color: '#6b7280', textDecoration: 'none' }}>Teams</a>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: '#9ca3af' }}>{team.name}</span>
        </nav>

        {/* Team info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          {team.crest_url && (
            <img src={team.crest_url} alt={team.name}
              style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} />
          )}
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'var(--font-display, sans-serif)' }}>
              {team.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
              {team.country_code && (
                <span style={{ fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                  🌍 {team.country_code}
                </span>
              )}
              {team.stadium_name && (
                <span style={{ fontSize: 13, color: '#9ca3af' }}>🏟 {team.stadium_name}</span>
              )}
              {team.founded_year && (
                <span style={{ fontSize: 13, color: '#9ca3af' }}>📅 Est. {team.founded_year}</span>
              )}
            </div>
          </div>
        </div>

        {/* Season stats */}
        {stats && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {[
              { label: 'Played', value: stats.played },
              { label: 'Won', value: stats.wins, color: '#22c55e' },
              { label: 'Drawn', value: stats.draws, color: '#f59e0b' },
              { label: 'Lost', value: stats.losses, color: '#ef4444' },
              { label: 'GF', value: stats.goals_for, color: '#3b82f6' },
              { label: 'GA', value: stats.goals_against, color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '10px 16px',
                textAlign: 'center',
                minWidth: 60,
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color ?? '#fff' }}>{s.value ?? 0}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Form strip */}
        {formReversed.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#6b7280', marginRight: 4 }}>FORM</span>
            {formReversed.map((m: any, i: number) => {
              const r = getResult(m, m.home_team_id);
              return (
                <a key={i} href={`/matches/${m.slug}`}
                  title={`${m.home_name} ${m.home_score}-${m.away_score} ${m.away_name}`}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: RESULT_COLOR[r],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 12,
                    textDecoration: 'none',
                  }}>{r}</a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
