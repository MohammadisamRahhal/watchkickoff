import type { Metadata } from 'next';

export const metadata: Metadata = { title: '404 · Page Not Found' };

export default function NotFound() {
  return (
    <div className="container" style={{
      paddingTop: 80,
      paddingBottom: 80,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 96,
        fontWeight: 700,
        color: 'var(--border)',
        lineHeight: 1,
        letterSpacing: '0.02em',
      }}>
        404
      </div>
      <p style={{
        marginTop: 16,
        color: 'var(--text-muted)',
        fontSize: 16,
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.04em',
      }}>
        Page not found
      </p>
      <a
        href="/"
        style={{
          display: 'inline-block',
          marginTop: 28,
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.07em',
          padding: '10px 24px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}
      >
        Back to Home
      </a>
    </div>
  );
}
