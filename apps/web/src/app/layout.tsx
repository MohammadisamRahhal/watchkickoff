import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "WatchKickoff — Live Football Scores", template: "%s · WatchKickoff" },
  description: "Live football scores, fixtures, standings and match details from 500+ leagues worldwide.",
  openGraph: { type: "website", siteName: "WatchKickoff" },
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
    { href: "/",        label: "Today"            },
    { href: "/live",    label: "Live", live: true  },
    { href: "/leagues", label: "Leagues"           },
    { href: "/search",  label: "Search"            },
  ];
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a href="/" className="site-logo">
          <span className="site-logo__icon">⚽</span>
          <span>WATCH<span style={{ color: "#1e40af" }}>KICKOFF</span></span>
        </a>
        <nav className="site-nav">
          {NAV.map(({ href, label, live }) => (
            <a key={href} href={href} className="nav-link">
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

const FOOTER_LEAGUES = [
  { label: "Premier League",    href: "/leagues/premier-league-2025-2026/overview" },
  { label: "La Liga",           href: "/leagues/la-liga-2025-2026/overview" },
  { label: "Serie A",           href: "/leagues/serie-a-2025-2026/overview" },
  { label: "Bundesliga",        href: "/leagues/bundesliga-2025-2026/overview" },
  { label: "Ligue 1",           href: "/leagues/ligue-1-2025-2026/overview" },
  { label: "Champions League",  href: "/leagues/uefa-champions-league-2025-2026/overview" },
  { label: "Europa League",     href: "/leagues/europa-league-2025-2026/overview" },
  { label: "Saudi Pro League",  href: "/leagues/saudi-pro-league-2025-2026/overview" },
];

const FOOTER_LINKS = [
  { label: "Today Matches", href: "/" },
  { label: "Live Scores",   href: "/live" },
  { label: "All Leagues",   href: "/leagues" },
  { label: "Search",        href: "/search" },
];

const FOOTER_COMPANY = [
  { label: "About Us",           href: "/about" },
  { label: "Contact Us",         href: "/contact" },
  { label: "Privacy Policy",     href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#1e40af", textTransform: "uppercase", marginBottom: 14 }}>{title}</div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
        {links.map(l => (
          <li key={l.label}>
            <a href={l.href} style={{ color: "#8a9bb0", textDecoration: "none", fontSize: 13 }}>{l.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SiteFooter() {
  return (
    <div style={{ background: "#0f1923", color: "#8a9bb0", marginTop: 60, borderTop: "1px solid #1e2d3d" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 16px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 32 }}>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ width: 32, height: 32, background: "#1e40af", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚽</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#ffffff", letterSpacing: "0.05em" }}>
              WATCH<span style={{ color: "#1e40af" }}>KICKOFF</span>
            </span>
          </div>
          <p style={{ lineHeight: 1.7, maxWidth: 240, color: "#6b7f94", fontSize: 13 }}>
            Live football scores, fixtures, standings and stats from 500+ leagues worldwide. Updated every 60 seconds.
          </p>
        </div>

        <FooterCol title="Top Leagues" links={FOOTER_LEAGUES} />
        <FooterCol title="Quick Links" links={FOOTER_LINKS} />
        <FooterCol title="Company"    links={FOOTER_COMPANY} />
      </div>

      <div style={{ borderTop: "1px solid #1a2634", padding: "16px", maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ color: "#4a5a6a", fontSize: 12 }}>© 2026 WatchKickoff. All rights reserved.</span>
        <span style={{ color: "#4a5a6a", fontSize: 12 }}>Data by <a href="https://www.api-football.com" style={{ color: "#1e40af", textDecoration: "none" }}>API-Football</a> · Updates every 60s</span>
      </div>
    </div>
  );
}
