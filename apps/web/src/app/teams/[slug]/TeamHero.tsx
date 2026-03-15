'use client';

const COUNTRY_NAMES: Record<string, string> = {
  GB: 'England', ES: 'Spain', DE: 'Germany', FR: 'France', IT: 'Italy',
  PT: 'Portugal', NL: 'Netherlands', BE: 'Belgium', AR: 'Argentina',
  BR: 'Brazil', SA: 'Saudi Arabia', US: 'United States', TR: 'Turkey',
  RU: 'Russia', MX: 'Mexico', CO: 'Colombia', NG: 'Nigeria',
  EG: 'Egypt', MA: 'Morocco', SN: 'Senegal', GH: 'Ghana', CM: 'Cameroon',
  SC: 'Scotland', IE: 'Ireland', HR: 'Croatia', RS: 'Serbia', UA: 'Ukraine',
  PL: 'Poland', CZ: 'Czech Republic', RO: 'Romania', HU: 'Hungary',
  GR: 'Greece', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  CH: 'Switzerland', AT: 'Austria', JP: 'Japan', KR: 'South Korea',
  CN: 'China', AU: 'Australia', ZA: 'South Africa', TN: 'Tunisia',
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
    <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '20px 16px 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</a>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>{team.name}</span>
        </nav>

        {/* Top row: crest + name + stats — exactly like Sofascore */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          {/* Crest */}
          {team.crest_url && (
            <img src={team.crest_url} alt={team.name} style={{ width: 68, height: 68, objectFit: 'contain', flexShrink: 0 }} />
          )}

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
              {team.name}
            </h1>
            {/* Meta: flag country | coach | stadium | est */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
              {flagCode && countryName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', marginRight: 14 }}>
                  <img src={`https://flagcdn.com/24x18/${flagCode}.png`} alt={countryName}
                    style={{ width: 18, height: 14, borderRadius: 2 }}
                    onError={(e: any) => e.target.style.display='none'} />
                  <span>{countryName}</span>
                </div>
              )}
              {team.coach_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', marginRight: 14 }}>
                  {team.coach_photo && (
                    <img src={team.coach_photo} alt={team.coach_name}
                      style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{team.coach_name}</span>
                </div>
              )}
              {team.stadium_name && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 14 }}>🏟 {team.stadium_name}</div>
              )}
              {team.founded_year && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Est. {team.founded_year}</div>
              )}
            </div>
          </div>

          {/* Stats chips — right side */}
          {stats && (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {[
                { label: 'P', value: stats.played, color: 'var(--text)' },
                { label: 'W', value: stats.wins, color: '#22c55e' },
                { label: 'D', value: stats.draws, color: '#f59e0b' },
                { label: 'L', value: stats.losses, color: '#ef4444' },
                { label: 'GF', value: stats.goals_for, color: 'var(--blue)' },
                { label: 'GA', value: stats.goals_against, color: 'var(--text-muted)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '5px 10px', textAlign: 'center', minWidth: 38, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value ?? 0}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form strip — no "FORM" label, just circles like Sofascore */}
        {formReversed.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 12 }}>
            {formReversed.map((m: any, i: number) => {
              const isHome = m.home_team_id === teamId;
              const result = getResult(m, teamId);
              const oppCrest = isHome ? m.away_crest : m.home_crest;
              const oppName = isHome ? m.away_name : m.home_name;
              return (
                <a key={i} href={`/matches/${m.slug}`}
                  title={`${m.home_name} ${m.home_score}-${m.away_score} ${m.away_name}`}
                  style={{ textDecoration: 'none' }}>
                  <div style={{ position: 'relative', width: 32, height: 32 }}>
                    {oppCrest
                      ? <img src={oppCrest} alt={oppName} style={{ width: 30, height: 30, objectFit: 'contain' }} onError={(e:any)=>e.target.style.display='none'} />
                      : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-elevated)' }} />
                    }
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: RESULT_BG[result], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', border: '1.5px solid var(--bg-card)' }}>{result}</div>
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
