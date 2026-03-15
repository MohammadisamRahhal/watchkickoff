'use client';

function getResult(match: any, teamId: string): 'W' | 'D' | 'L' {
  const isHome = match.home_team_id === teamId;
  const gs = isHome ? match.home_score : match.away_score;
  const ga = isHome ? match.away_score : match.home_score;
  if (gs > ga) return 'W';
  if (gs < ga) return 'L';
  return 'D';
}

const RESULT_BG: Record<string, string> = { W: '#22c55e', D: '#f59e0b', L: '#ef4444' };

export default function TeamHero({ team, stats, form }: { team: any; stats: any; form: any[] }) {
  if (!team) return null;
  const formReversed = [...(form ?? [])].reverse();

  return (
    <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '24px 16px 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <nav style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</a>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>{team.name}</span>
        </nav>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {team.crest_url && (
            <img src={team.crest_url} alt={team.name} style={{ width: 72, height: 72, objectFit: 'contain', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>{team.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {team.country_code && team.country_code !== 'WW' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                  <img src={`https://flagcdn.com/20x15/${team.country_code.toLowerCase()}.png`} alt="" style={{ width: 18, height: 13, borderRadius: 2 }} />
                  <span>{team.country_code}</span>
                </div>
              )}
              {team.stadium_name && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🏟 {team.stadium_name}</span>}
              {team.founded_year && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Est. {team.founded_year}</span>}
              {team.coach_name && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {team.coach_photo && <img src={team.coach_photo} alt={team.coach_name} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />}
                  👔 {team.coach_name}
                </span>
              )}
            </div>
          </div>

          {stats && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { label: 'P', value: stats.played, color: 'var(--text)' },
                { label: 'W', value: stats.wins, color: '#22c55e' },
                { label: 'D', value: stats.draws, color: '#f59e0b' },
                { label: 'L', value: stats.losses, color: '#ef4444' },
                { label: 'GF', value: stats.goals_for, color: 'var(--blue)' },
                { label: 'GA', value: stats.goals_against, color: 'var(--text-muted)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '6px 10px', textAlign: 'center', minWidth: 40, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value ?? 0}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {formReversed.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginRight: 2 }}>FORM</span>
            {formReversed.map((m: any, i: number) => {
              const r = getResult(m, m.home_team_id);
              return (
                <a key={i} href={`/matches/${m.slug}`} title={`${m.home_name} ${m.home_score}-${m.away_score} ${m.away_name}`}
                  style={{ textDecoration: 'none' }}>
                  <div style={{ position: 'relative', width: 30, height: 30 }}>
                    <img src={m.away_crest} alt={m.away_name} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: RESULT_BG[r], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', border: '1px solid white' }}>{r}</div>
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
