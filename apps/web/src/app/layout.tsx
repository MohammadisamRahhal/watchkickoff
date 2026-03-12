import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'WatchKickoff — Live Football Scores', template: '%s · WatchKickoff' },
  description: 'Live football scores, fixtures, standings and match details from 500+ leagues.',
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
    { href: '/',        label: 'Today'            },
    { href: '/live',    label: 'Live', live: true  },
    { href: '/leagues', label: 'Leagues'           },
    { href: '/search',  label: 'Search'            },
  ];
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a href="/" className="site-logo">
          <span className="site-logo__icon">⚽</span>
          <span className="site-logo__text">WATCH<span className="site-logo__accent">KICKOFF</span></span>
        </a>
        <nav className="site-nav">
          {NAV.map(({ href, label, live }) => (
            <a key={href} href={href} className="nav-link">
              {live && <span className="nav-link__dot live-dot" />}
              {label}
            </a>
          ))}
        </nav>
        <div className="header-right">
          <span className="header-live">
            <span className="live-dot" />
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <span className="site-footer__brand">⚽ WATCHKICKOFF</span>
        <span>Data by API-Football · Updates every 60s</span>
        <div className="site-footer__links">
          <a href="/leagues">Leagues</a>
          <span>·</span>
          <a href="/live">Live</a>
          <span>·</span>
          <a href="/search">Search</a>
        </div>
      </div>
    </footer>
  );
}
