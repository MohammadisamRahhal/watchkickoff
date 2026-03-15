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
  { id: 'overview',   label: 'Overview' },
  { id: 'fixtures',   label: 'Fixtures' },
  { id: 'table',      label: 'Table' },
  { id: 'squad',      label: 'Squad' },
  { id: 'stats',      label: 'Stats' },
  { id: 'transfers',  label: 'Transfers' },
];

interface Props {
  slug: string; activeTab: string; overview: any;
  fixtures: any[]; results: any[]; squad: any[];
  standings: any; stats: any; transfers: any[];
}

export default function TeamClientPage({
  slug, activeTab, overview, fixtures, results, squad, standings, stats, transfers,
}: Props) {
  const [tab, setTab] = useState(() => {
    if (activeTab === 'standings') return 'table';
    if (activeTab === 'results') return 'fixtures';
    return activeTab;
  });
  const team = overview?.team;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '8px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <nav style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</a>
            <span>›</span>
            <a href="/leagues" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Teams</a>
            <span>›</span>
            <span style={{ color: 'var(--text)' }}>{team?.name}</span>
          </nav>
        </div>
      </div>

      <TeamHero
        team={team}
        stats={overview?.stats}
        form={overview?.form}
        teamId={team?.id}
        nextMatch={overview?.nextMatch}
        standings={standings}
      />

      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => { setTab(t.id); window.history.replaceState(null, '', `?tab=${t.id}`); }}
              style={{
                padding: '13px 20px', border: 'none',
                borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
                marginBottom: -1, background: 'transparent',
                color: tab === t.id ? 'var(--blue)' : 'var(--text-muted)',
                fontWeight: tab === t.id ? 700 : 500, fontSize: 13,
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 80px' }}>
        {tab === 'overview'  && <TeamOverview overview={overview} teamId={team?.id} />}
        {tab === 'fixtures'  && <TeamFixtures fixtures={fixtures} results={results} teamId={team?.id} teamSlug={slug} />}
        {tab === 'table'     && <TeamStandings standings={standings} teamId={team?.id} teamSlug={slug} />}
        {tab === 'squad'     && <TeamSquad squad={squad} coach={team?.coach_name ? { name: team.coach_name, photo: team.coach_photo } : undefined} />}
        {tab === 'stats'     && <TeamStats stats={stats} teamSlug={slug} />}
        {tab === 'transfers' && <TeamTransfers transfers={transfers} teamId={team?.id} />}
      </div>
    </div>
  );
}
