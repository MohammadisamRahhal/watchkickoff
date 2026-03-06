'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{
        fontFamily: 'sans-serif',
        background: '#0b0e14',
        color: '#e8ecf2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: '0 16px',
      }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: '#6b778f', marginBottom: 24 }}>
            {error.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 24px',
              background: '#1a1f2b',
              border: '1px solid #242935',
              borderRadius: 4,
              color: '#e8ecf2',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
