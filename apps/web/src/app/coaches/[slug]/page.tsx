import type { Metadata } from 'next';

interface Props { params: Promise<{ slug: string }> }

function formatName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${formatName(slug)} | WatchKickoff` };
}

export default async function CoachPage({ params }: Props) {
  const { slug } = await params;
  const name = formatName(slug);

  // Try to find team with this coach
  let coachData: any = null;
  try {
    const res = await fetch(`${process.env.API_URL ?? 'http://localhost:3001'}/api/v1/teams/coach/${encodeURIComponent(name)}`, { cache: 'no-store' });
    if (res.ok) { const j = await res.json(); coachData = j.data; }
  } catch {}

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 60px' }}>
      <nav style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</a>
        <span>›</span>
        <span style={{ color: 'var(--text)' }}>{name}</span>
      </nav>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {/* Hero */}
        <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 20 }}>
          {coachData?.coach_photo ? (
            <img src={coachData.coach_photo} alt={name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-elevated)', border: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>👔</div>
          )}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>{name}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Football Manager</div>
            {coachData && (
              <a href={`/teams/${coachData.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '6px 14px', background: 'rgba(29,78,216,0.08)', borderRadius: 20, textDecoration: 'none', border: '1px solid rgba(29,78,216,0.2)' }}>
                {coachData.crest_url && <img src={coachData.crest_url} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />}
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>Current Club: {coachData.name}</span>
              </a>
            )}
          </div>
        </div>

        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Coach profile coming soon</div>
          <div style={{ fontSize: 13 }}>Detailed coaching history and statistics will be available here.</div>
        </div>
      </div>
    </div>
  );
}
