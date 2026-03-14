import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamBySlug, getTeamMatches } from '@/lib/api';
import { MatchRow, EmptyState } from '@/components/ui';
import { isLive, isFinished } from '@/lib/utils';
import Image from 'next/image';

export async function generateMetadata({ params }: any): Promise<Metadata> {
  try {
    const { slug } = await params;
    const team = await getTeamBySlug(slug);
    return { title: `${team.name} Fixtures & Results` };
  } catch { return { title: 'Fixtures' }; }
}

export const revalidate = 60;

function TeamHeader({ team, slug, active }: { team: any; slug: string; active: string }) {
  const tabs = [
    { id: 'fixtures',  label: 'Fixtures',  href: `/teams/${slug}/fixtures` },
    { id: 'standings', label: 'Standings', href: `/teams/${slug}/standings` },
    { id: 'squad',     label: 'Squad',     href: `/teams/${slug}/squad` },
  ];
  return (
    <>
      <div className="match-hero" style={{ marginBottom: 0, padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, flexShrink: 0, position: 'relative' }}>
            {team.crestUrl
              ? <Image src={team.crestUrl} alt={team.name} fill style={{ objectFit: 'contain' }} sizes="64px" unoptimized />
              : <div style={{ width: 64, height: 64, background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--text-muted)' }}>{team.name.slice(0,2).toUpperCase()}</div>
            }
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{team.name}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{team.countryCode}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', background: 'var(--surface)', borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' as any }}>
        {tabs.map(t => (
          <a key={t.id} href={t.href} style={{
            padding: '13px 20px', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
            whiteSpace: 'nowrap', textDecoration: 'none', flexShrink: 0,
            color: active === t.id ? 'var(--text)' : 'var(--text-dim)',
            borderBottom: active === t.id ? '2px solid var(--green)' : '2px solid transparent',
            marginBottom: -1,
          }}>{t.label.toUpperCase()}</a>
        ))}
      </div>
    </>
  );
}

function groupByDate(matches: any[]) {
  const map = new Map<string, { label: string; matches: any[] }>();
  const today = new Date().toISOString().slice(0,10);
  for (const m of matches) {
    const d = new Date(m.kickoffAt);
    const iso = d.toISOString().slice(0,10);
    const label = iso === today ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!map.has(iso)) map.set(iso, { label, matches: [] });
    map.get(iso)!.matches.push(m);
  }
  return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
}

const DIVIDER: React.CSSProperties = {
  padding: '8px 14px', background: 'var(--bg-elevated)',
  fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
  letterSpacing: '0.05em', textTransform: 'uppercase' as const,
  borderBottom: '1px solid var(--border)',
};

export default async function TeamFixturesPage({ params }: any) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug).catch(() => null);
  if (!team) notFound();
  const matches = await getTeamMatches(slug).catch(() => []);

  const sorted = [...matches].sort((a:any,b:any) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
  const live     = sorted.filter((m:any) => isLive(m.status));
  const finished = sorted.filter((m:any) => isFinished(m.status)).reverse();
  const upcoming = sorted.filter((m:any) => !isLive(m.status) && !isFinished(m.status));

  const upcomingGroups = groupByDate(upcoming);
  const finishedGroups = groupByDate(finished.slice(0,20)).reverse();

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <a href="/leagues">Leagues</a><span className="breadcrumb__sep">›</span>
        <span>{team.name}</span><span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>Fixtures</span>
      </nav>

      <TeamHeader team={team} slug={slug} active="fixtures" />

      {matches.length === 0 ? <EmptyState message="No fixtures available." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {live.length > 0 && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ ...DIVIDER, color: 'var(--green)' }}>🔴 Live Now</div>
              {live.map((m:any) => <MatchRow key={m.id} match={m} />)}
            </div>
          )}
          {upcomingGroups.length > 0 && (
            <div className="card" style={{ overflow: 'hidden' }}>
              {upcomingGroups.map(([iso, g]) => (
                <div key={iso}>
                  <div style={DIVIDER}>{g.label}</div>
                  {g.matches.map((m:any) => <MatchRow key={m.id} match={m} />)}
                </div>
              ))}
            </div>
          )}
          {finishedGroups.length > 0 && (
            <div className="card" style={{ overflow: 'hidden' }}>
              {finishedGroups.map(([iso, g]) => (
                <div key={iso}>
                  <div style={DIVIDER}>{g.label}</div>
                  {g.matches.map((m:any) => <MatchRow key={m.id} match={m} />)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
