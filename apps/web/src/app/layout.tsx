import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'WatchKickoff', template: '%s · WatchKickoff' },
  description: 'Live football scores, fixtures, standings and match details.',
  openGraph: {
    type: 'website',
    siteName: 'WatchKickoff',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(11,14,20,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', gap: 32, height: 52,
      }}>
        <a href="/" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20, fontWeight: 700,
          letterSpacing: '0.04em',
          color: 'var(--text)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: 'var(--green)' }}>⚽</span>
          WATCHKICKOFF
        </a>

        <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
          {[
            { href: '/',         label: 'Today' },
            { href: '/live',     label: 'Live' },
            { href: '/leagues',  label: 'Leagues' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14, fontWeight: 600,
                letterSpacing: '0.05em',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text)';
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={{
      marginTop: 80,
      borderTop: '1px solid var(--border)',
      padding: '28px 0',
      color: 'var(--text-dim)',
      fontSize: 13,
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.04em' }}>
          WATCHKICKOFF
        </span>
        <span>Data provided by API-Football</span>
      </div>
    </footer>
  );
}
