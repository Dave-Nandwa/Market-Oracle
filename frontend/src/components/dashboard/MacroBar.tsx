'use client';
import { useEffect, useState } from 'react';
import { fetchMacro } from '@/lib/api';
import type { MacroData } from '@/lib/types';

export default function MacroBar() {
  const [macro, setMacro] = useState<MacroData | null>(null);

  useEffect(() => {
    fetchMacro().then(setMacro).catch(console.error);
  }, []);

  const fmt = (v: string | undefined) => {
    if (!v) return '—';
    const n = parseFloat(v);
    if (isNaN(n)) return v;
    if (n > 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return n.toFixed(2);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A11] border-t border-[#2A2A3E] px-4 py-1.5 flex items-center gap-6 text-xs z-50 overflow-x-auto">
      <span className="text-[#475569] font-mono text-[10px] flex-shrink-0">MACRO</span>
      {macro ? (
        <>
          <MacroItem label="VIX" value={fmt(macro.vix?.value)} />
          <MacroItem label="S&P500" value={fmt(macro.spx?.value)} />
          <MacroItem label="COMP" value={fmt(macro.comp?.value)} />
          <MacroItem label="10Y Yield" value={`${fmt(macro.treasury10y?.value)}%`} />
          <MacroItem label="Fed Rate" value={`${fmt(macro.fedRate?.value)}%`} />
        </>
      ) : (
        <span className="text-[#475569] animate-pulse">Loading…</span>
      )}
      <span className="ml-auto text-[#1E1E2E] font-mono text-[10px]">MARKET ORACLE</span>
    </div>
  );
}

function MacroItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <span className="text-[#475569]">{label}</span>
      <span className="font-mono text-[#94A3B8]">{value}</span>
    </div>
  );
}
