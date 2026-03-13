import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'WatchKickoff — Live Football Scores', template: '%s · WatchKickoff' },
  description: 'Live football scores, fixtures, standings and match details from 500+ leagues worldwide.',
  openGraph: { type: 'website', siteName: 'WatchKickoff' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="site-main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  const NAV = [
    { href: '/',        label: 'Today'           },
    { href: '/live',    label: 'Live', live: true },
    { href: '/leagues', label: 'Leagues'          },
    { href: '/search',  label: 'Search'           },
  ];
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a href="/" className="site-logo">
          <span className="site-logo__icon">⚽</span>
          <span>WATCH<span style={{ color: 'var(--blue)' }}>KICKOFF</span></span>
        </a>
        <nav className="site-nav">
          {NAV.map(({ href, label, live }) => (
            <a key={href} href={href} className="nav-link">
              {live && <span className="nav-link__dot" />}
              {label}
            </a>
          ))}
        </nav>
        <div className="header-right">
          <a href="/live" className="header-live">
            <span className="live-dot" style={{ width: 7, height: 7, flexShrink: 0 }} />
            LIVE
          </a>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  const leagues = [
    { label: 'Premier League', href: '/leagues/premier-league-2025-2026/overview' },
    { label: 'La Liga',        href: '/leagues/la-liga-2025-2026/overview' },
    { label: 'Serie A',        href: '/leagues/serie-a-2025-2026/overview' },
    { label: 'Bundesliga',     href: '/leagues/bundesliga-2025-2026/overview' },
    { label: 'Ligue 1',        href: '/leagues/ligue-1-2025-2026/overview' },
    { label: 'Champions League', href: '/leagues/uefa-champions-league-2025-2026/overview' },
    { label: 'Europa League',  href: '/leagues/europa-league-2025-2026/overview' },
    { label: 'Saudi Pro League', href: '/leagues/saudi-pro-league-2025-2026/overview' },
  ];

  return (
    <footer style={{
      background: '#0f1923', color: '#8a9bb0', marginTop: 60,
      borderTop: '1px solid #1e2d3d', fontSize: 13,
    }}>
      {/* Main footer */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 16px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32 }}>

        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 32, height: 32, background: '#1565c0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚽</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em' }}>
              WATCH<span style={{ color: '#4fc3f7' }}>KICKOFF</span>
            </span>
          </div>
          <p style={{ lineHeight: 1.7, maxWidth: 240, color: '#6b7f94', fontSize: 13 }}>
            Live football scores, fixtures, standings and stats from 500+ leagues worldwide. Updated every 60 seconds.
          </p>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            {[
              { label: '🌐', href: 'https://watchkickoff.com' },
            ].map(s => (
              <a key={s.label} href={s.href} style={{ width: 34, height: 34, borderRadius: 8, background: '#1a2634', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#8a9bb0', textDecoration: 'none' }}>{s.label}</a>
            ))}
          </div>
        </div>

        {/* Top Leagues */}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#4fc3f7', textTransform: 'uppercase', marginBottom: 14 }}>Top Leagues</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leagues.map(l => (
              <li key={l.label}>
                <a href={l.href} style={{ color: '#8a9bb0', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s' }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#8a9bb0')}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#4fc3f7', textTransform: 'uppercase', marginBottom: 14 }}>Quick Links</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Today's Matches', href: '/' },
              { label: 'Live Scores',      href: '/live' },
              { label: 'All Leagues',      href: '/leagues' },
              { label: 'Search',           href: '/search' },
            ].map(l => (
              <li key={l.label}>
                <a href={l.href} style={{ color: '#8a9bb0', textDecoration: 'none', fontSize: 13 }}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#4fc3f7', textTransform: 'uppercase', marginBottom: 14 }}>Company</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'About Us',         href: '/about' },
              { label: 'Contact Us',       href: '/contact' },
              { label: 'Privacy Policy',   href: '/privacy' },
              { label: 'Terms & Conditions', href: '/terms' },
            ].map(l => (
              <li key={l.label}>
                <a href={l.href} style={{ color: '#8a9bb0', textDecoration: 'none', fontSize: 13 }}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid #1a2634', padding: '16px', maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ color: '#4a5a6a', fontSize: 12 }}>© 2026 WatchKickoff. All rights reserved.</span>
        <span style={{ color: '#4a5a6a', fontSize: 12 }}>Data provided by <a href="https://www.api-football.com" style={{ color: '#4fc3f7', textDecoration: 'none' }}>API-Football</a></span>
      </div>
    </footer>
  );
}
