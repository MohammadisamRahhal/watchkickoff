'use client';

const COUNTRY_NAMES: Record<string, string> = {
  GB: 'England', ES: 'Spain', DE: 'Germany', FR: 'France', IT: 'Italy',
  PT: 'Portugal', NL: 'Netherlands', BE: 'Belgium', AR: 'Argentina',
  BR: 'Brazil', SA: 'Saudi Arabia', US: 'United States', TR: 'Turkey',
  RU: 'Russia', JP: 'Japan', MX: 'Mexico', CO: 'Colombia', NG: 'Nigeria',
  EG: 'Egypt', MA: 'Morocco', SN: 'Senegal', GH: 'Ghana', CM: 'Cameroon',
};

function getResult(match: any, teamId: string): 'W' | 'D' | 'L' {
  const isHome = match.home_team_id === teamId;
  const gs = isHome ? Number(match.home_score) : Number(match.away_score);
  const ga = isHome ? Number(match.away_score) : Number(match.home_score);
  if (gs > ga) return 'W';
  if (gs < ga) return 'L';
  return 'D';
}

const RESULT_BG: Record<string, string> = { W: '#22c55e', D: '#f59e0b', L: '#ef4444' };

export default function TeamHero({ team, stats, form, teamId }: { team: any; stats: any; form: any[]; teamId: string }) {
  if (!team) return null;
  const formReversed = [...(form ?? [])].reverse();
  const countryName = COUNTRY_NAMES[team.country_code] ?? team.country_code ?? '';
  const flagCode = team.country_code?.toLowerCase();

  return (
    <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '24px 16px 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</a>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>{team.name}</span>
        </nav>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Crest */}
          {team.crest_url && (
            <img src={team.crest_url} alt={team.name}
              style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }} />
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
              {team.name}
            </h1>

            {/* Meta row — علم + بلد + ملعب + تأسيس */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
              {flagCode && countryName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                  <img src={`https://flagcdn.com/24x18/${flagCode}.png`} alt={countryName}
                    style={{ width: 20, height: 15, borderRadius: 2, border: '1px solid var(--border)' }}
                    onError={(e: any) => e.target.style.display='none'} />
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{countryName}</span>
                </div>
              )}
              {team.stadium_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>🏟</span>
                  <span>{team.stadium_name}</span>
                </div>
              )}
              {team.founded_year && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Est. <span style={{ fontWeight: 600, color: 'var(--text)' }}>{team.founded_year}</span>
                </div>
              )}
            </div>

            {/* Coach row */}
            {team.coach_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {team.coach_photo && (
                  <img src={team.coach_photo} alt={team.coach_name}
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                )}
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coach</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{team.coach_name}</div>
                </div>
              </div>
            )}
          </div>

          {/* Season stats */}
          {stats && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {[
                { label: 'P', value: stats.played, color: 'var(--text)' },
                { label: 'W', value: stats.wins, color: '#22c55e' },
                { label: 'D', value: stats.draws, color: '#f59e0b' },
                { label: 'L', value: stats.losses, color: '#ef4444' },
                { label: 'GF', value: stats.goals_for, color: 'var(--blue)' },
                { label: 'GA', value: stats.goals_against, color: 'var(--text-muted)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '6px 12px', textAlign: 'center', minWidth: 44, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.value ?? 0}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form strip — FIX: show opponent crest, not team's own */}
        {formReversed.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>FORM</span>
            {formReversed.map((m: any, i: number) => {
              const isHome = m.home_team_id === teamId;
              const result = getResult(m, teamId);
              // الخصم هو الفريق الثاني
              const oppCrest = isHome ? m.away_crest : m.home_crest;
              const oppName = isHome ? m.away_name : m.home_name;
              const score = `${m.home_score}-${m.away_score}`;
              return (
                <a key={i} href={`/matches/${m.slug}`}
                  title={`${m.home_name} ${score} ${m.away_name}`}
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ position: 'relative', width: 32, height: 32 }}>
                    {oppCrest
                      ? <img src={oppCrest} alt={oppName} style={{ width: 30, height: 30, objectFit: 'contain' }} />
                      : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
                    }
                    <div style={{
                      position: 'absolute', bottom: -3, right: -3,
                      width: 14, height: 14, borderRadius: '50%',
                      background: RESULT_BG[result],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 800, color: '#fff',
                      border: '1.5px solid var(--bg-card)',
                    }}>{result}</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
