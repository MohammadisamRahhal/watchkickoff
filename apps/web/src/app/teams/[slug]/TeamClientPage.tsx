'use client';
import { useState } from 'react';
import TeamHero from './TeamHero';
import TeamOverview from './TeamOverview';
import TeamFixtures from './TeamFixtures';
import TeamSquad from './TeamSquad';
import TeamStandings from './TeamStandings';
import TeamStats from './TeamStats';
import TeamTransfers from './TeamTransfers';

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'fixtures',  label: 'Fixtures' },
  { id: 'results',   label: 'Results' },
  { id: 'squad',     label: 'Squad' },
  { id: 'standings', label: 'Standings' },
  { id: 'stats',     label: 'Stats' },
  { id: 'transfers', label: 'Transfers' },
];

interface Props {
  slug: string; activeTab: string; overview: any;
  fixtures: any[]; results: any[]; squad: any[];
  standings: any; stats: any; transfers: any[];
}

export default function TeamClientPage({ slug, activeTab, overview, fixtures, results, squad, standings, stats, transfers }: Props) {
  const [tab, setTab] = useState(activeTab);
  const team = overview?.team;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <TeamHero team={team} stats={overview?.stats} form={overview?.form} />

      {/* Tabs */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '2px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => { setTab(t.id); window.history.replaceState(null, '', `?tab=${t.id}`); }}
              style={{
                padding: '12px 18px',
                border: 'none',
                borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
                marginBottom: -2,
                background: 'transparent',
                color: tab === t.id ? 'var(--blue)' : 'var(--text-muted)',
                fontWeight: tab === t.id ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-body)',
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 60px' }}>
        {tab === 'overview'  && <TeamOverview overview={overview} teamId={team?.id} />}
        {tab === 'fixtures'  && <TeamFixtures matches={fixtures} teamId={team?.id} type="fixtures" />}
        {tab === 'results'   && <TeamFixtures matches={results} teamId={team?.id} type="results" />}
        {tab === 'squad'     && <TeamSquad squad={squad} />}
        {tab === 'standings' && <TeamStandings standings={standings} teamId={team?.id} />}
        {tab === 'stats'     && <TeamStats stats={stats} />}
        {tab === 'transfers' && <TeamTransfers transfers={transfers} teamId={team?.id} />}
      </div>
    </div>
  );
}
