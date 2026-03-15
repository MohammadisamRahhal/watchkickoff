import { notFound } from 'next/navigation';

interface Props { params: Promise<{ slug: string }> }

export default async function CoachPage({ params }: Props) {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <nav style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</a>
        <span>›</span>
        <span>Coach</span>
        <span>›</span>
        <span style={{ color: 'var(--text)' }}>{name}</span>
      </nav>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 32, border: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-elevated)', border: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>👔</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>{name}</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Coach profile coming soon</p>
      </div>
    </div>
  );
}
