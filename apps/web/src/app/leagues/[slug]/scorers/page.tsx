import type { Metadata } from 'next';
import { getLeagueBySlug, getLeagueScorers } from '@/lib/api';
import { ErrorBanner } from '@/components/ui';
import LeagueHeader from '@/components/LeagueHeader';
import ScorersClient from './ScorersClient';

export const dynamic = 'force-dynamic';
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const l = await getLeagueBySlug(slug);
    const yr = Number(l.season ?? 2025);
    return { title: `${l.name} ${yr}/${yr+1} Stats · WatchKickoff` };
  } catch { return { title: 'Stats · WatchKickoff' }; }
}

export default async function ScorersPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { season: seasonParam } = await searchParams;

  const [leagueRes, scorersRes] = await Promise.allSettled([
    getLeagueBySlug(slug),
    getLeagueScorers(slug),
  ]);

  const league  = leagueRes.status  === 'fulfilled' ? leagueRes.value  : null;
  const scorers = scorersRes.status === 'fulfilled' ? scorersRes.value as any[] : [];

  if (!league) return (
    <div className="container" style={{paddingTop:28}}>
      <ErrorBanner message="League not found." />
    </div>
  );

  const season = seasonParam ?? league.season ?? '2025';

  return (
    <div className="container" style={{paddingTop:20, paddingBottom:60}}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <span>{league.name}</span><span className="breadcrumb__sep">›</span>
        <span style={{color:'var(--text-muted)'}}>Stats</span>
      </nav>
      <LeagueHeader league={league} activeTab="scorers" season={season} />
      <ScorersClient scorers={scorers} slug={slug} />
    </div>
  );
}
