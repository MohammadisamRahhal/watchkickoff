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

interface Props {
  team: any;
  stats: any;
  form: any[];
  teamId: string;
  nextMatch?: any;
  standings?: any;
}

export default function TeamHero({ team, stats, form, teamId, nextMatch, standings }: Props) {
  if (!team) return null;

  const formReversed = [...(form ?? [])].reverse();
  const countryName = COUNTRY_NAMES[team.country_code] ?? team.country_code ?? '';
  const flagCode = team.country_code?.toLowerCase();
  const teamRow = standings?.table?.find((r: any) => r.team_id === teamId);
  const leaguePos = teamRow?.position;
  const leagueName = standings?.league?.name;
  const leagueSlug = standings?.league?.slug;
  const totalTeams = standings?.table?.length ?? 0;

  return (
    <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 0' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
          <div style={{ flexShrink: 0 }}>
            {team.crest_url
              ? <img src={team.crest_url} alt={team.name} style={{ width: 80, height: 80, objectFit: 'contain', display: 'block' }} />
              : <div style={{ width: 80, height: 80, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'var(--text-muted)' }}>{team.name?.[0]}</div>
            }
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
              {team.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {flagCode && countryName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>
                  <img src={`https://flagcdn.com/24x18/${flagCode}.png`} alt={countryName}
                    style={{ width: 16, height: 12, borderRadius: 2 }}
                    onError={(e: any) => e.target.style.display = 'none'} />
                  <span>{countryName}</span>
                </div>
              )}
              {team.coach_name && (
                <a href={`/coaches/${team.coach_name.toLowerCase().replace(/\s+/g, '-')}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--blue)', background: 'rgba(29,78,216,0.06)', padding: '3px 8px', borderRadius: 20, border: '1px solid rgba(29,78,216,0.15)', textDecoration: 'none' }}>
                  {team.coach_photo && (
                    <img src={team.coach_photo} alt={team.coach_name} style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <span style={{ fontWeight: 600 }}>{team.coach_name}</span>
                </a>
              )}
              {team.stadium_name && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>
                  🏟 {team.stadium_name}
                </div>
              )}
              {team.founded_year && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>
                  Est. {team.founded_year}
                </div>
              )}
            </div>
          </div>

          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {leaguePos && leagueName && (
              <a href={leagueSlug ? `/leagues/${leagueSlug}/standings` : '#'}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', borderRadius: 10, padding: '8px 12px', border: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--blue)', lineHeight: 1 }}>{leaguePos}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>/{totalTeams}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leagueName}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{teamRow?.points ?? 0} pts</div>
                </div>
              </a>
            )}
            {stats && Number(stats.played) > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { label: 'P',  value: stats.played,        color: 'var(--text)' },
                  { label: 'W',  value: stats.wins,          color: '#22c55e' },
                  { label: 'D',  value: stats.draws,         color: '#f59e0b' },
                  { label: 'L',  value: stats.losses,        color: '#ef4444' },
                  { label: 'GF', value: stats.goals_for,     color: 'var(--blue)' },
                  { label: 'GA', value: stats.goals_against, color: 'var(--text-muted)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '5px 9px', textAlign: 'center', minWidth: 36, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value ?? 0}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 14, borderTop: '1px solid var(--border)', paddingTop: 12, flexWrap: 'wrap' }}>
          {formReversed.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Form</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {formReversed.map((m: any, i: number) => {
                  const isHome = m.home_team_id === teamId;
                  const result = getResult(m, teamId);
                  const oppCrest = isHome ? m.away_crest : m.home_crest;
                  const oppName  = isHome ? m.away_name  : m.home_name;
                  const score = `${m.home_name} ${m.home_score}-${m.away_score} ${m.away_name}`;
                  return (
                    <a key={i} href={`/matches/${m.slug}`} title={score} style={{ textDecoration: 'none' }}>
                      <div style={{ position: 'relative', width: 30, height: 30 }}>
                        {oppCrest
                          ? <img src={oppCrest} alt={oppName} style={{ width: 28, height: 28, objectFit: 'contain' }} onError={(e: any) => e.target.style.display = 'none'} />
                          : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
                        }
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 13, height: 13, borderRadius: '50%', background: RESULT_BG[result], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900, color: '#fff', border: '1.5px solid var(--bg-card)' }}>{result}</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {formReversed.length > 0 && nextMatch && (
            <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
          )}

          {nextMatch && (
            <a href={`/matches/${nextMatch.slug}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
                <img src={nextMatch.home_crest} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" onError={(e: any) => e.target.style.display = 'none'} />
                <span style={{ fontSize: 12, fontWeight: nextMatch.home_team_id === teamId ? 700 : 400, color: 'var(--text)' }}>{nextMatch.home_name}</span>
                <div style={{ textAlign: 'center', padding: '0 4px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>VS</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {new Date(nextMatch.kickoff_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <img src={nextMatch.away_crest} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" onError={(e: any) => e.target.style.display = 'none'} />
                <span style={{ fontSize: 12, fontWeight: nextMatch.away_team_id === teamId ? 700 : 400, color: 'var(--text)' }}>{nextMatch.away_name}</span>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
