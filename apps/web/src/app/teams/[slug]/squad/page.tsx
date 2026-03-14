import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamBySlug, getTeamSquad } from '@/lib/api';
import { EmptyState, TeamCrest } from '@/components/ui';
import { countryFlag } from '@/lib/utils';
import Image from 'next/image';

export async function generateMetadata({ params }: any): Promise<Metadata> {
  try {
    const { slug } = await params;
    const team = await getTeamBySlug(slug);
    return { title: `${team.name} Squad` };
  } catch { return { title: 'Squad' }; }
}

export const revalidate = 3600;

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

const POS_ORDER = ['Goalkeeper','Defender','Midfielder','Attacker'];
const POS_LABEL: Record<string,string> = { Goalkeeper:'GK', Defender:'DEF', Midfielder:'MID', Attacker:'FWD' };

export default async function TeamSquadPage({ params }: any) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug).catch(() => null);
  if (!team) notFound();
  const squad = await getTeamSquad(slug).catch(() => []);

  const byPos: Record<string,any[]> = {};
  for (const p of squad as any[]) {
    const pos = p.position ?? 'Unknown';
    if (!byPos[pos]) byPos[pos] = [];
    byPos[pos].push(p);
  }
  const groups = [...POS_ORDER, ...Object.keys(byPos).filter(p => !POS_ORDER.includes(p))].filter(p => byPos[p]);

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <span>{team.name}</span><span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>Squad</span>
      </nav>

      <TeamHeader team={team} slug={slug} active="squad" />

      {squad.length === 0 ? <EmptyState message="Squad not available." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(pos => (
            <div key={pos} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                {pos} ({byPos[pos].length})
              </div>
              {byPos[pos].map((p:any) => (
                <a key={p.id ?? p.slug} href={`/players/${p.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {p.shirtNumber ?? POS_LABEL[pos] ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.name}</div>
                    {p.nationalityCode && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{countryFlag(p.nationalityCode)} {p.nationalityCode}</div>}
                  </div>
                  <span style={{ color: 'var(--text-dim)', fontSize: 16 }}>›</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
