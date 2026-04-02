'use client';
import Link from 'next/link';
import type { TickerOverview } from '@/lib/types';

interface Props {
  overview: TickerOverview | null;
  symbol: string;
}

export default function TickerHeader({ overview, symbol }: Props) {
  const isPositive = overview ? parseFloat(overview.change) >= 0 : null;
  const changeColor = isPositive === null ? '#64748B' : isPositive ? '#10B981' : '#EF4444';

  return (
    <header className="market-oracle-header px-4 py-3 flex items-center gap-6 flex-wrap">
      {/* Back + Logo */}
      <Link href="/" className="text-[#64748B] hover:text-white transition-colors text-sm font-mono">
        ← ORACLE
      </Link>

      {/* Symbol + Name */}
      <div>
        <span className="font-mono font-bold text-xl text-[#7C3AED]">{symbol}</span>
        {overview?.name && (
          <span className="ml-2 text-sm text-[#64748B] hidden sm:inline">{overview.name}</span>
        )}
        {overview?.exchange && (
          <span className="ml-2 text-xs text-[#475569]">{overview.exchange}</span>
        )}
      </div>

      {/* Price */}
      {overview ? (
        <>
          <div className="font-mono">
            <span className="text-2xl font-bold text-white">
              {overview.currency === 'USD' ? '$' : ''}{overview.price}
            </span>
            <span className="ml-2 text-sm" style={{ color: changeColor }}>
              {isPositive ? '+' : ''}{overview.change} ({overview.changePct})
            </span>
          </div>

          {/* Key stats */}
          <div className="flex items-center gap-4 text-xs ml-auto flex-wrap">
            <Stat label="Vol" value={parseInt(overview.volume || '0').toLocaleString()} />
            <Stat label="Mkt Cap" value={formatMktCap(overview.marketCap)} />
            <Stat label="52W H" value={overview.high52week ? `$${overview.high52week}` : '—'} />
            <Stat label="52W L" value={overview.low52week ? `$${overview.low52week}` : '—'} />
            <Stat label="P/E" value={overview.pe || '—'} />
            <Stat label="Beta" value={overview.beta || '—'} />
          </div>
        </>
      ) : (
        <div className="text-[#64748B] text-sm animate-pulse">Loading…</div>
      )}
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[#475569] uppercase text-[10px] tracking-wider">{label}</span>
      <span className="font-mono text-[#E2E8F0]">{value}</span>
    </div>
  );
}

function formatMktCap(v: string): string {
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}
