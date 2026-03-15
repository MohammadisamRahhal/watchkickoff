'use client';

function formatFee(amount: number | null, type: string): string {
  if (type === 'FREE') return 'Free';
  if (['LOAN','LOAN_RETURN','LOAN_END'].includes(type)) return 'Loan';
  if (!amount) return '-';
  if (amount >= 1000000) return `€${(amount/1000000).toFixed(1)}M`;
  if (amount >= 1000) return `€${(amount/1000).toFixed(0)}K`;
  return `€${amount}`;
}

export default function TeamTransfers({ transfers, teamId }: { transfers: any[]; teamId: string }) {
  if (!transfers.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔄</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>No transfers recorded yet</div>
      <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Transfer data will appear here when available</div>
    </div>
  );
  const incoming = transfers.filter((t: any) => t.to_team_id === teamId);
  const outgoing = transfers.filter((t: any) => t.from_team_id === teamId);
  function renderList(list: any[], dir: 'in' | 'out') {
    if (!list.length) return <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 0' }}>None recorded.</div>;
    return list.map((t: any) => (
      <a key={t.id} href={`/players/${t.player_slug}`} style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 8, marginBottom: 6, border: '1px solid var(--border)' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: dir === 'in' ? '#22c55e18' : '#ef444418', border: `1px solid ${dir === 'in' ? '#22c55e40' : '#ef444440'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, color: dir === 'in' ? '#22c55e' : '#ef4444', fontWeight: 800 }}>{dir === 'in' ? '↓' : '↑'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t.player_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              {dir === 'in' ? <>{t.from_crest && <img src={t.from_crest} style={{ width: 12, height: 12, objectFit: 'contain' }} alt="" />}<span>{t.from_team_name ?? 'Unknown'}</span></> : <>{t.to_crest && <img src={t.to_crest} style={{ width: 12, height: 12, objectFit: 'contain' }} alt="" />}<span>{t.to_team_name ?? 'Unknown'}</span></>}
              {t.transfer_date && <span>• {new Date(t.transfer_date).getFullYear()}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.fee_type === 'FREE' ? 'var(--text-muted)' : '#22c55e' }}>{formatFee(t.fee_amount, t.fee_type)}</div>
            {t.position && <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{t.position}</div>}
          </div>
        </div>
      </a>
    ));
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>↓ Arrivals ({incoming.length})</h3>
        {renderList(incoming, 'in')}
      </div>
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>↑ Departures ({outgoing.length})</h3>
        {renderList(outgoing, 'out')}
      </div>
    </div>
  );
}
