import type { Metadata } from 'next';
import { searchAll } from '@/lib/api';
import { TeamCrest, ErrorBanner } from '@/components/ui';
import { countryFlag } from '@/lib/utils';

interface Props { searchParams: Promise<{ q?: string; type?: string }> }

export const metadata: Metadata = {
  title: 'Search — WatchKickoff',
  description: 'Search for teams, leagues and players.',
};

export const revalidate = 60;

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', type = 'all' } = await searchParams;

  let results = { teams: [] as any[], leagues: [] as any[], players: [] as any[] };
  let error: string | null = null;

  if (q.trim().length >= 2) {
    try { results = await searchAll(q); }
    catch { error = 'Search failed. Please try again.'; }
  }

  const total = results.teams.length + results.leagues.length + results.players.length;

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>

      {/* Search header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 16 }}>
          SEARCH
        </h1>

        {/* Search form */}
        <form action="/search" method="get" style={{ display: 'flex', gap: 8 }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search teams, leagues, players..."
            autoFocus
            style={{
              flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '10px 16px',
              color: 'var(--text)', fontSize: 15, fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
          />
          <button type="submit" style={{
            background: 'var(--green)', color: '#000', border: 'none',
            borderRadius: 'var(--radius)', padding: '10px 20px',
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 13, letterSpacing: '0.06em', cursor: 'pointer',
          }}>
            SEARCH
          </button>
        </form>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* No query */}
      {!q.trim() && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Search for teams, leagues or players</div>
        </div>
      )}

      {/* No results */}
      {q.trim().length >= 2 && total === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>No results for "{q}"</div>
        </div>
      )}

      {/* Results */}
      {total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Teams */}
          {results.teams.length > 0 && (
            <div className="card">
              <div className="card__header">
                <span className="card__title">Teams</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{results.teams.length}</span>
              </div>
              <div>
                {results.teams.map((t: any, i: number) => (
                  <a key={t.id} href={`/teams/${t.slug}`} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px',
                    borderBottom: i < results.teams.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }} className="match-row">
                    <TeamCrest url={t.crestUrl} name={t.name} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                        {countryFlag(t.countryCode)} {t.countryCode}
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-dim)' }}>›</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Leagues */}
          {results.leagues.length > 0 && (
            <div className="card">
              <div className="card__header">
                <span className="card__title">Leagues</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{results.leagues.length}</span>
              </div>
              <div>
                {results.leagues.map((l: any, i: number) => (
                  <a key={l.id} href={`/leagues/${l.slug}`} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px',
                    borderBottom: i < results.leagues.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }} className="match-row">
                    <span style={{ fontSize: 24 }}>{countryFlag(l.countryCode)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{l.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{l.season}</div>
                    </div>
                    <span style={{ color: 'var(--text-dim)' }}>›</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Players */}
          {results.players.length > 0 && (
            <div className="card">
              <div className="card__header">
                <span className="card__title">Players</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{results.players.length}</span>
              </div>
              <div>
                {results.players.map((p: any, i: number) => (
                  <a key={p.id} href={`/players/${p.slug}`} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px',
                    borderBottom: i < results.players.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }} className="match-row">
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--bg-elevated)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                    }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                        {p.position && <span style={{ marginRight: 8 }}>{p.position}</span>}
                        {p.nationalityCode && <span>{countryFlag(p.nationalityCode)} {p.nationalityCode}</span>}
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-dim)' }}>›</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
