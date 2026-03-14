import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTeamBySlug, getTeamStandings } from '@/lib/api';
import { EmptyState, TeamCrest } from '@/components/ui';
import Image from 'next/image';

export async function generateMetadata({ params }: any): Promise<Metadata> {
  try {
    const { slug } = await params;
    const team = await getTeamBySlug(slug);
    return { title: `${team.name} Standings` };
  } catch { return { title: 'Standings' }; }
}

export const revalidate = 300;

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
              : <div style={{ width: 64, height: 64, background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>{team.name.slice(0,2).toUpperCase()}</div>
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

const ZONE_COLORS: Record<string,string> = { PROMOTION:'#3b82f6', CHAMPIONSHIP:'#f97316', RELEGATION:'#ef4444' };

export default async function TeamStandingsPage({ params }: any) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug).catch(() => null);
  if (!team) notFound();
  const standings = await getTeamStandings(slug).catch(() => []);

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <nav className="breadcrumb">
        <a href="/">Today</a><span className="breadcrumb__sep">›</span>
        <span>{team.name}</span><span className="breadcrumb__sep">›</span>
        <span style={{ color: 'var(--text-muted)' }}>Standings</span>
      </nav>

      <TeamHeader team={team} slug={slug} active="standings" />

      {standings.length === 0 ? <EmptyState message="Standings not available." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(standings as any[]).map((s:any) => (
            <div key={s.leagueId ?? s.id} className="card" style={{ overflow: 'hidden' }}>
              <a href={`/leagues/${s.leagueSlug}/standings`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                {s.leagueLogo && <img src={s.leagueLogo} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />}
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.leagueName}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>Full table →</span>
              </a>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 380 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['#','Team','P','W','D','L','GD','Pts'].map((h,i) => (
                        <th key={h} style={{ padding: '8px 8px', textAlign: i<2?'left' as const:'center' as const, fontSize: 11, fontWeight: 700, color: h==='Pts'?'var(--blue-bright)':'var(--text-dim)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(s.rows ?? []).sort((a:any,b:any) => a.position-b.position).map((row:any) => {
                      const zoneColor = ZONE_COLORS[row.zone ?? ''];
                      const isCurrentTeam = row.teamSlug === slug;
                      return (
                        <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border-subtle)', background: isCurrentTeam ? 'rgba(30,64,175,0.06)' : undefined }}>
                          <td style={{ padding: '9px 8px', position: 'relative' }}>
                            {zoneColor && <span style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, borderRadius: 2, background: zoneColor }} />}
                            <span style={{ fontSize: 12, fontWeight: isCurrentTeam?700:400, color: 'var(--text-muted)', paddingLeft: 6 }}>{row.position}</span>
                          </td>
                          <td style={{ padding: '9px 8px' }}>
                            <a href={`/teams/${row.teamSlug}/fixtures`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text)' }}>
                              <TeamCrest url={row.teamCrest ?? null} name={row.teamName ?? ''} size={20} />
                              <span style={{ fontSize: 13, fontWeight: isCurrentTeam?700:500 }}>{row.teamName}</span>
                              {isCurrentTeam && <span style={{ fontSize: 10, background: '#1e40af', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>YOU</span>}
                            </a>
                          </td>
                          {[row.played,row.wins,row.draws,row.losses].map((v,i) => (
                            <td key={i} style={{ padding: '9px 8px', textAlign: 'center' as const, fontSize: 13, color: 'var(--text-muted)' }}>{v}</td>
                          ))}
                          <td style={{ padding: '9px 8px', textAlign: 'center' as const, fontSize: 13, fontWeight: 600, color: row.goalDiff>0?'var(--green)':row.goalDiff<0?'var(--red)':'var(--text-muted)' }}>
                            {row.goalDiff>0?`+${row.goalDiff}`:row.goalDiff}
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'center' as const, fontWeight: 800, fontSize: 14 }}>{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
