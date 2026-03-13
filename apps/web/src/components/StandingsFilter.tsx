'use client';

interface Props { slug: string; active: string; }

export default function StandingsFilter({ slug, active }: Props) {
  const filters = [
    { id: 'all',  label: 'All' },
    { id: 'home', label: 'Home' },
    { id: 'away', label: 'Away' },
  ];

  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
      {filters.map(f => (
        <a key={f.id}
          href={`/leagues/${slug}/standings${f.id !== 'all' ? `?filter=${f.id}` : ''}`}
          style={{
            padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', border: '1px solid var(--border)',
            background: active === f.id ? 'var(--green)' : 'var(--bg-card)',
            color: active === f.id ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}>
          {f.label}
        </a>
      ))}
    </div>
  );
}
