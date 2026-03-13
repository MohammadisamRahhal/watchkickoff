'use client';
import { useState, useRef, useEffect } from 'react';

interface Props {
  slug: string;
  currentSeason: string;
  seasons: string[];
}

export default function SeasonDropdown({ slug, currentSeason, seasons }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 2025 → "25/26"
  const label = (s: string) => {
    const y = Number(s);
    return `${String(y).slice(2)}/${String(y+1).slice(2)}`;
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--surface-2)', borderRadius: 6,
        padding: '5px 12px', cursor: 'pointer',
        border: '1px solid var(--border)', outline: 'none',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{label(currentSeason)}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, minWidth: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          {seasons.map(s => (
            <a key={s} href={`/leagues/${slug}/fixtures?season=${s}`} style={{
              display: 'block', padding: '9px 16px',
              fontSize: 13, fontWeight: s === currentSeason ? 700 : 400,
              color: s === currentSeason ? 'var(--green)' : 'var(--text)',
              textDecoration: 'none',
              background: s === currentSeason ? 'rgba(0,200,100,0.08)' : 'transparent',
              borderBottom: '1px solid var(--border)',
            }}>
              {label(s)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
