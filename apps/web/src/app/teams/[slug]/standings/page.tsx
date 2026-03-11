import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamBySlug, getTeamStandings } from '@/lib/api';

export async function generateMetadata({ params }: any): Promise<Metadata> {
  try {
    const { slug } = await params;
    const team = await getTeamBySlug(slug);
    return {
      title: `${team.name} Standings — League Table | WatchKickoff`,
      description: `Current league standings for ${team.name}. Position, points, wins, draws and losses.`,
    };
  } catch { return { title: 'Standings' }; }
}

export const revalidate = 300;

export default async function TeamStandingsPage({ params }: any) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug).catch(() => null);
  if (!team) notFound();
  const standings = await getTeamStandings(slug).catch(() => []);
  const tabs = [
    { id: 'fixtures',  label: 'Fixtures',  href: `/teams/${slug}/fixtures` },
    { id: 'standings', label: 'Standings', href: `/teams/${slug}/standings` },
    { id: 'squad',     label: 'Squad',     href: `/teams/${slug}/squad` },
  ];
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', gap: 8 }}>
        <a href="/" style={{ color: 'var(--text-muted)' }}>Today</a>
        <span>›</span>
        <a href={`/teams/${slug}`} style={{ color: 'var(--text-muted)' }}>{team.name}</a>
        <span>›</span>
        <span>Standings</span>
      </nav>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        {team.crestUrl ? (
          <img src={team.crestUrl} alt={team.name} style={{ width: 72, height: 72, objectFit: 'contain' }} />
        ) : (
          <div style={{ width: 72, height: 72, background: 'var(--border-subtle)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--text-muted)' }}>
            {team.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{team.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{team.countryCode}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-subtle)', marginBottom: 24 }}>
        {tabs.map(t => (
          <a key={t.id} href={t.href} style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            color: t.id === 'standings' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: t.id === 'standings' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -2,
          }}>{t.label.toUpperCase()}</a>
        ))}
      </div>
      {standings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No standings available.</div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-alt)', color: 'var(--text-muted)', fontSize: 11 }}>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>League</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>P</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>W</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>D</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>L</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>GD</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {(standings as any[]).map((row: any) => (
                <tr key={row.teamId} style={{ borderTop: '1px solid var(--border-subtle)', background: row.teamSlug === slug ? 'rgba(0,200,100,0.08)' : 'transparent' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{row.position}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <a href={`/leagues/${row.league_slug}`} style={{ color: 'var(--text)', fontWeight: 500, textDecoration: 'none' }}>{row.league_name}</a>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.played}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.wins}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.draws}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.losses}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: row.goal_diff > 0 ? 'var(--accent)' : row.goal_diff < 0 ? '#ef4444' : 'var(--text-muted)' }}>{row.goal_diff > 0 ? '+' : ''}{row.goal_diff}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--text)' }}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
