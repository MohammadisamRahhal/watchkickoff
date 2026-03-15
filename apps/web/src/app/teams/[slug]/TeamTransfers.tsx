'use client';

function formatFee(amount: number | null, type: string): string {
  if (type === 'FREE') return 'Free';
  if (['LOAN','LOAN_RETURN','LOAN_END'].includes(type)) return 'Loan';
  if (!amount) return '-';
  if (amount >= 1000000) return `€${(amount/1000000).toFixed(1)}M`;
  if (amount >= 1000) return `€${(amount/1000).toFixed(0)}K`;
  return `€${amount}`;
}

function TransferRow({ t, direction }: { t: any; direction: 'in' | 'out' }) {
  const isIn = direction === 'in';
  return (
    <a href={`/players/${t.player_slug}`} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, marginBottom: 4, border: '1px solid var(--border)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isIn ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{t.player_name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isIn ? (
              <>{t.from_crest && <img src={t.from_crest} style={{ width: 14, height: 14, objectFit: 'contain' }} alt="" />}<span>{t.from_team_name ?? 'Unknown'}</span></>
            ) : (
              <>{t.to_crest && <img src={t.to_crest} style={{ width: 14, height: 14, objectFit: 'contain' }} alt="" />}<span>{t.to_team_name ?? 'Unknown'}</span></>
            )}
            {t.transfer_date && <span>• {new Date(t.transfer_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.fee_type === 'FREE' ? 'var(--text-muted)' : t.fee_type === 'LOAN' ? '#f59e0b' : '#22c55e' }}>
            {formatFee(t.fee_amount, t.fee_type)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.position ?? ''}</div>
        </div>
      </div>
    </a>
  );
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

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 8 }}>
            ↓ Arrivals <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>({incoming.length})</span>
          </h3>
          {incoming.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>None recorded.</div>
            : incoming.map((t: any) => <TransferRow key={t.id} t={t} direction="in" />)
          }
        </div>
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
            ↑ Departures <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>({outgoing.length})</span>
          </h3>
          {outgoing.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>None recorded.</div>
            : outgoing.map((t: any) => <TransferRow key={t.id} t={t} direction="out" />)
          }
        </div>
      </div>
    </div>
  );
}
