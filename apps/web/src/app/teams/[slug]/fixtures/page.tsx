import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamBySlug, getTeamMatches } from '@/lib/api';

function MatchRow({ match }: { match: any }) {
  const date = new Date(match.kickoffAt);
  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';
  return (
    <a href={`/matches/${match.slug}`} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      background: 'var(--surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 8, marginBottom: 6, textDecoration: 'none',
    }} className="match-row">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {match.homeTeam?.crestUrl && <img src={match.homeTeam?.crestUrl} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />}
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{match.homeTeam?.name}</span>
      </div>
      <div style={{ textAlign: 'center', minWidth: 80 }}>
        {isFinished || isLive ? (
          <span style={{ fontSize: 16, fontWeight: 800, color: isLive ? 'var(--live)' : 'var(--text)' }}>
            {match.homeScore} – {match.awayScore}
          </span>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {isLive && <div style={{ fontSize: 10, color: 'var(--live)', fontWeight: 700 }}>LIVE</div>}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        {match.awayTeam?.crestUrl && <img src={match.awayTeam?.crestUrl} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />}
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{match.awayTeam?.name}</span>
      </div>
    </a>
  );
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  try {
    const { slug } = await params;
    const team = await getTeamBySlug(slug);
    return {
      title: `${team.name} Fixtures & Results | WatchKickoff`,
      description: `Latest fixtures and results for ${team.name}.`,
    };
  } catch { return { title: 'Fixtures' }; }
}

export const revalidate = 60;

export default async function TeamFixturesPage({ params }: any) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug).catch(() => null);
  if (!team) notFound();
  const matches = await getTeamMatches(slug).catch(() => []);
  const finished = matches.filter((m: any) => m.status === 'FINISHED');
  const upcoming = matches.filter((m: any) => m.status === 'SCHEDULED' || m.status === 'POSTPONED');
  const live     = matches.filter((m: any) => m.status === 'LIVE');
  const tabs = [
    { id: 'fixtures',  label: 'Fixtures',  href: `/teams/${slug}/fixtures` },
    { id: 'standings', label: 'Standings', href: `/teams/${slug}/standings` },
    { id: 'squad',     label: 'Squad',     href: `/teams/${slug}/squad` },
  ];
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', gap: 8 }}>
        <a href="/" style={{ color: 'var(--text-muted)' }}>Today</a>
        <span>›</span>
        <a href={`/teams/${slug}`} style={{ color: 'var(--text-muted)' }}>{team.name}</a>
        <span>›</span>
        <span>Fixtures</span>
      </nav>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        {team.crestUrl ? (
          <img src={team.crestUrl} alt={team.name} style={{ width: 72, height: 72, objectFit: 'contain' }} />
        ) : (
          <div style={{ width: 72, height: 72, background: 'var(--border-subtle)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--text-muted)' }}>
            {team.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{team.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
            <span>{team.countryCode}</span>
            {matches.length > 0 && <span>· {matches.length} matches</span>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-subtle)', marginBottom: 24 }}>
        {tabs.map(t => (
          <a key={t.id} href={t.href} style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            color: t.id === 'fixtures' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: t.id === 'fixtures' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -2,
          }}>{t.label.toUpperCase()}</a>
        ))}
      </div>
      <div>
        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No fixtures available.</div>
        ) : (
          <>
            {live.length > 0 && <div style={{ marginBottom: 24 }}><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--live)', marginBottom: 8, letterSpacing: 1 }}>🔴 LIVE</div>{live.map((m: any) => <MatchRow key={m.id} match={m} />)}</div>}
            {upcoming.length > 0 && <div style={{ marginBottom: 24 }}><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 1 }}>UPCOMING</div>{upcoming.slice(0, 10).map((m: any) => <MatchRow key={m.id} match={m} />)}</div>}
            {finished.length > 0 && <div><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 1 }}>RESULTS</div>{finished.slice(0, 20).map((m: any) => <MatchRow key={m.id} match={m} />)}</div>}
          </>
        )}
      </div>
    </main>
  );
}
