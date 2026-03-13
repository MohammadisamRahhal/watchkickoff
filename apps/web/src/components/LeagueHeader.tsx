import SeasonDropdown from './SeasonDropdown';

interface League {
  name: string;
  slug: string;
  logo?: string | null;
  countryCode?: string;
  season?: string;
}

interface Props {
  league: League;
  activeTab: 'overview' | 'fixtures' | 'standings' | 'scorers' | 'stats';
  season: string;
  liveCount?: number;
}

export default function LeagueHeader({ league, activeTab, season, liveCount = 0 }: Props) {
  const { slug } = league;
  const flagUrl = league.countryCode && league.countryCode !== 'WW' && league.countryCode.length === 2
    ? `https://flagcdn.com/24x18/${league.countryCode.toLowerCase()}.png`
    : null;

  const tabs = [
    { id: 'overview',  label: 'OVERVIEW',  href: `/leagues/${slug}/overview` },
    { id: 'fixtures',  label: 'FIXTURES',  href: `/leagues/${slug}/fixtures` },
    { id: 'standings', label: 'STANDINGS', href: `/leagues/${slug}/standings` },
    { id: 'scorers',   label: 'SCORERS',   href: `/leagues/${slug}/scorers` },
  ];

  const yr = Number(season);

  return (
    <>
      <div className="match-hero" style={{ marginBottom: 0, padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {league.logo
              ? <img src={league.logo} alt={league.name} style={{ width: 56, height: 56, objectFit: 'contain' }} />
              : <span style={{ fontSize: 40 }}>⚽</span>}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              {league.name}{' '}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 15 }}>{yr}/{yr+1}</span>
            </h1>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              {flagUrl && <img src={flagUrl} alt={league.countryCode} style={{ width: 24, height: 18, borderRadius: 2, objectFit: 'cover' }} />}
              <SeasonDropdown slug={slug} currentSeason={season} seasons={['2024','2025','2026']} />
              {liveCount > 0 && <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>🔴 {liveCount} LIVE</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', background: 'var(--surface)', borderBottom: '1px solid var(--border)', overflowX: 'auto', marginBottom: 20 }}>
        {tabs.map(({ id, label, href }) => (
          <a key={id} href={href} style={{
            padding: '13px 20px', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
            whiteSpace: 'nowrap', textDecoration: 'none',
            color: activeTab === id ? 'var(--text)' : 'var(--text-dim)',
            borderBottom: activeTab === id ? '2px solid var(--green)' : '2px solid transparent',
            marginBottom: -1,
          }}>{label}</a>
        ))}
      </div>
    </>
  );
}
