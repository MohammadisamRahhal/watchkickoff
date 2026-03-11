import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamBySlug, getTeamSquad } from '@/lib/api';

export async function generateMetadata({ params }: any): Promise<Metadata> {
  try {
    const { slug } = await params;
    const team = await getTeamBySlug(slug);
    return {
      title: `${team.name} Squad & Players | WatchKickoff`,
      description: `Full squad list for ${team.name}. Players, positions and nationalities.`,
    };
  } catch { return { title: 'Squad' }; }
}

export const revalidate = 3600;

export default async function TeamSquadPage({ params }: any) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug).catch(() => null);
  if (!team) notFound();
  const squad = await getTeamSquad(slug).catch(() => []);
  const tabs = [
    { id: 'fixtures',  label: 'Fixtures',  href: `/teams/${slug}/fixtures` },
    { id: 'standings', label: 'Standings', href: `/teams/${slug}/standings` },
    { id: 'squad',     label: 'Squad',     href: `/teams/${slug}/squad` },
  ];
  const byPosition: Record<string, any[]> = {};
  for (const p of squad as any[]) {
    const pos = p.position ?? 'Unknown';
    if (!byPosition[pos]) byPosition[pos] = [];
    byPosition[pos].push(p);
  }
  const posOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker', 'Unknown'];
  const sorted = posOrder.filter(p => byPosition[p]).concat(Object.keys(byPosition).filter(p => !posOrder.includes(p)));
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', gap: 8 }}>
        <a href="/" style={{ color: 'var(--text-muted)' }}>Today</a>
        <span>›</span>
        <a href={`/teams/${slug}`} style={{ color: 'var(--text-muted)' }}>{team.name}</a>
        <span>›</span>
        <span>Squad</span>
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
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
            <span>{team.countryCode}</span>
            {squad.length > 0 && <span>· {squad.length} players</span>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-subtle)', marginBottom: 24 }}>
        {tabs.map(t => (
          <a key={t.id} href={t.href} style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            color: t.id === 'squad' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: t.id === 'squad' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -2,
          }}>{t.label.toUpperCase()}</a>
        ))}
      </div>
      {squad.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Squad not available yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sorted.map(pos => (
            <div key={pos}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>{pos.toUpperCase()} ({byPosition[pos].length})</div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {byPosition[pos].map((p: any) => (
                      <tr key={p.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 16px' }}>
                          <a href={`/players/${p.slug}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>{p.name}</a>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 12 }}>{p.nationality_code ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
