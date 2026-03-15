import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getTeamOverview, getTeamFixtures, getTeamResults,
  getTeamSquad, getTeamStandings, getTeamStats, getTeamTransfers,
} from '@/lib/api';
import TeamClientPage from './TeamClientPage';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const data = await getTeamOverview(slug);
    return {
      title: `${data.team.name} — Squad, Fixtures & Stats | WatchKickoff`,
      description: `${data.team.name} fixtures, results, squad, standings and stats.`,
    };
  } catch { return { title: 'Team | WatchKickoff' }; }
}

export default async function TeamPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab = 'overview' } = await searchParams;

  let overview: any = null;
  try { overview = await getTeamOverview(slug); } catch { notFound(); }

  const [fixturesRes, resultsRes, squadRes, standingsRes, statsRes, transfersRes] = await Promise.allSettled([
    getTeamFixtures(slug),
    getTeamResults(slug),
    getTeamSquad(slug),
    getTeamStandings(slug),
    getTeamStats(slug),
    getTeamTransfers(slug),
  ]);

  return (
    <TeamClientPage
      slug={slug}
      activeTab={tab}
      overview={overview}
      fixtures={fixturesRes.status === 'fulfilled' ? fixturesRes.value : []}
      results={resultsRes.status === 'fulfilled' ? resultsRes.value : []}
      squad={squadRes.status === 'fulfilled' ? squadRes.value : []}
      standings={standingsRes.status === 'fulfilled' ? standingsRes.value : null}
      stats={statsRes.status === 'fulfilled' ? statsRes.value : null}
      transfers={transfersRes.status === 'fulfilled' ? transfersRes.value : []}
    />
  );
}
