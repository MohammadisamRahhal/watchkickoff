'use client';

const FEE_COLOR: Record<string, string> = {
  PAID: '#22c55e', FREE: '#6b7280', LOAN: '#f59e0b',
  LOAN_RETURN: '#f59e0b', LOAN_END: '#f59e0b',
};

function formatFee(amount: number | null, currency: string, type: string): string {
  if (type === 'FREE') return 'Free';
  if (type === 'LOAN' || type === 'LOAN_RETURN') return 'Loan';
  if (!amount) return '—';
  if (amount >= 1000000) return `€${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `€${(amount / 1000).toFixed(0)}K`;
  return `€${amount}`;
}

export default function TeamTransfers({ transfers, teamId }: { transfers: any[]; teamId: string }) {
  if (!transfers.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>No transfers recorded yet</div>
      <div style={{ fontSize: 13, color: '#4b5563' }}>Transfer data will appear here when available</div>
    </div>
  );

  const incoming = transfers.filter((t: any) => t.to_team_id === teamId || (!t.from_team_id && t.to_team_name));
  const outgoing = transfers.filter((t: any) => t.from_team_id === teamId);

  function renderList(list: any[], direction: 'in' | 'out') {
    if (!list.length) return <div style={{ fontSize: 13, color: '#6b7280', padding: '12px 0' }}>None recorded.</div>;
    return list.map((t: any) => (
      <a key={t.id} href={`/players/${t.player_slug}`} style={{ textDecoration: 'none' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', background: '#1e2235',
          borderRadius: 10, marginBottom: 8, border: '1px solid #2a2d3a',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: direction === 'in' ? '#22c55e22' : '#ef444422',
            border: `2px solid ${direction === 'in' ? '#22c55e' : '#ef4444'}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>
            {direction === 'in' ? '↓' : '↑'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.player_name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              {direction === 'in' ? (
                <>
                  {t.from_crest && <img src={t.from_crest} style={{ width: 14, height: 14, objectFit: 'contain' }} alt="" />}
                  <span>{t.from_team_name ?? 'Unknown'}</span>
                </>
              ) : (
                <>
                  {t.to_crest && <img src={t.to_crest} style={{ width: 14, height: 14, objectFit: 'contain' }} alt="" />}
                  <span>{t.to_team_name ?? 'Unknown'}</span>
                </>
              )}
              {t.transfer_date && <span style={{ marginLeft: 4 }}>• {new Date(t.transfer_date).getFullYear()}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: FEE_COLOR[t.fee_type] ?? '#6b7280' }}>
              {formatFee(t.fee_amount, t.fee_currency, t.fee_type)}
            </div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{t.position ?? ''}</div>
          </div>
        </div>
      </a>
    ));
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
          ↓ Arrivals <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>({incoming.length})</span>
        </h3>
        {renderList(incoming, 'in')}
      </div>
      <div>
        <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
          ↑ Departures <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>({outgoing.length})</span>
        </h3>
        {renderList(outgoing, 'out')}
      </div>
    </div>
  );
}
