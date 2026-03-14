import { getLeagueSeasons } from '@/lib/api';
import SeasonDropdown from './SeasonDropdown';

interface League {
  name: string;
  slug: string;
  logo?: string | null;
  countryCode?: string | null;
  season?: string;
}

interface Props {
  league: League;
  activeTab: 'overview' | 'fixtures' | 'standings' | 'scorers' | 'stats';
  season: string;
  liveCount?: number;
}

const COUNTRY_NAMES: Record<string, string> = {
  'GB': 'England', 'GB-ENG': 'England', 'GB-SCT': 'Scotland', 'GB-WLS': 'Wales',
  'ES': 'Spain', 'DE': 'Germany', 'IT': 'Italy', 'FR': 'France',
  'PT': 'Portugal', 'NL': 'Netherlands', 'BE': 'Belgium', 'TR': 'Turkey',
  'SA': 'Saudi Arabia', 'US': 'USA', 'BR': 'Brazil', 'AR': 'Argentina',
  'MX': 'Mexico', 'JP': 'Japan', 'KR': 'South Korea', 'AU': 'Australia',
  'EG': 'Egypt', 'MA': 'Morocco', 'NG': 'Nigeria', 'WW': 'World', 'EU': 'Europe',
};

const FLAG_OVERRIDES: Record<string, string> = {
  'GB': 'gb-eng',
};

export default async function LeagueHeader({ league, activeTab, season, liveCount = 0 }: Props) {
  const { slug } = league;
  const yr = Number(season);

  const seasonSlugs = await getLeagueSeasons(slug).catch(() => [] as { season: string; slug: string }[]);

  const cc = league.countryCode ?? null;
  const flagCode = cc ? (FLAG_OVERRIDES[cc] ?? cc.toLowerCase()) : null;
  const flagUrl = flagCode && cc !== 'WW' ? `https://flagcdn.com/24x18/${flagCode}.png` : null;
  const countryName = cc ? (COUNTRY_NAMES[cc] ?? null) : null;

  // كل المواسم من الـ DB مرتبة من الأحدث للأقدم
  const dbSeasons = seasonSlugs.map(s => s.season);
  const allSeasons = [...new Set(dbSeasons)]
    .filter(s => !isNaN(Number(s)))
    .sort((a, b) => Number(b) - Number(a));

  // إذا ما في مواسم من DB، نحط الحالي على الأقل
  const seasons = allSeasons.length > 0 ? allSeasons : [season];

  const tabs = [
    { id: 'overview',  label: 'OVERVIEW',  href: `/leagues/${slug}/overview` },
    { id: 'fixtures',  label: 'FIXTURES',  href: `/leagues/${slug}/fixtures` },
    { id: 'standings', label: 'STANDINGS', href: `/leagues/${slug}/standings` },
    { id: 'scorers',   label: 'SCORERS',   href: `/leagues/${slug}/scorers` },
  ];

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
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
              {league.name}{' '}
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{yr}/{yr + 1}</span>
            </h1>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              {flagUrl && <img src={flagUrl} alt={cc ?? ''} style={{ width: 24, height: 18, borderRadius: 2, objectFit: 'cover' }} />}
              {countryName && <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{countryName}</span>}
              <SeasonDropdown
                slug={slug}
                currentSeason={season}
                seasons={seasons}
                seasonSlugs={seasonSlugs}
              />
              {liveCount > 0 && <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>🔴 {liveCount} LIVE</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', marginBottom: 20,
        overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {tabs.map(({ id, label, href }) => (
          <a key={id} href={href} style={{
            padding: '13px 20px', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
            whiteSpace: 'nowrap', textDecoration: 'none', flexShrink: 0,
            color: activeTab === id ? 'var(--text)' : 'var(--text-dim)',
            borderBottom: activeTab === id ? '2px solid var(--green)' : '2px solid transparent',
            marginBottom: -1,
          }}>{label}</a>
        ))}
      </div>
    </>
  );
}
