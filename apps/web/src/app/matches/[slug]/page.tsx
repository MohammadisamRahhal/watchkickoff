import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import MatchClientPage from './MatchClientPage';

async function getMatch(slug: string) {
  try {
    const res = await fetch(`http://localhost:3001/api/v1/matches/${slug}`, {
      next: { revalidate: 30 },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return null;
  }
}

async function resolveFixtureSlug(fixtureId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `http://localhost:3001/api/v1/matches/by-fixture/${fixtureId}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.slug ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const match = await getMatch(params.slug);
  if (!match) return { title: 'Match | WatchKickoff' };
  const { homeTeam, awayTeam, homeScore, awayScore, status } = match;
  const score = status === 'SCHEDULED' ? 'vs' : `${homeScore} - ${awayScore}`;
  return {
    title: `${homeTeam?.name} ${score} ${awayTeam?.name} | WatchKickoff`,
  };
}

export default async function MatchPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (slug.startsWith('fixture-')) {
    const fixtureId = slug.replace('fixture-', '');
    const realSlug = await resolveFixtureSlug(fixtureId);
    if (realSlug) redirect(`/matches/${realSlug}`);
  }

  const match = await getMatch(slug);
  if (!match) notFound();

  return <MatchClientPage match={match} />;
}
