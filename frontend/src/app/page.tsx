'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchTickers, fetchMacro } from '@/lib/api';
import type { SearchResult, MacroData } from '@/lib/types';

const QUICK_PICKS = ['SPY', 'QQQ', 'AAPL', 'NVDA', 'TSLA', 'BTC', 'ETH'];

function formatValue(v: string | undefined): string {
  if (!v) return '—';
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  if (n > 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return n.toFixed(2);
}

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [macro, setMacro] = useState<MacroData | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('mo_recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
    fetchMacro().then(setMacro).catch(console.error);
  }, []);

  useEffect(() => {
    if (query.length < 1) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try { setResults(await searchTickers(query)); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const navigate = (symbol: string) => {
    const updated = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('mo_recent_searches', JSON.stringify(updated));
    router.push(`/ticker/${symbol}`);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Macro bar */}
      <div className="bg-[#0D0D14] border-b border-[#2A2A3E] px-4 py-1.5 flex items-center gap-6 text-xs overflow-x-auto">
        {macro ? (
          <>
            <MacroItem label="VIX" value={formatValue(macro.vix?.value)} />
            <MacroItem label="S&P 500" value={formatValue(macro.spx?.value)} />
            <MacroItem label="NASDAQ" value={formatValue(macro.comp?.value)} />
            <MacroItem label="10Y" value={macro.treasury10y?.value ? `${formatValue(macro.treasury10y.value)}%` : '—'} />
            <MacroItem label="FED" value={macro.fedRate?.value ? `${formatValue(macro.fedRate.value)}%` : '—'} />
          </>
        ) : (
          <span className="text-[#64748B]">Loading macro data…</span>
        )}
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="font-mono text-5xl font-bold tracking-tight text-white mb-3">
            MARKET{' '}
            <span className="text-[#7C3AED]">ORACLE</span>
          </h1>
          <p className="text-[#64748B] text-lg">
            Quant-grade volatility analytics powered by Google TimesFM
          </p>
        </div>

        {/* Search */}
        <div className="w-full max-w-xl relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            onKeyDown={e => {
              if (e.key === 'Enter' && query) navigate(query);
              if (e.key === 'Escape') setQuery('');
            }}
            placeholder="Enter ticker symbol (AAPL, BTC, SPY…)"
            className="w-full bg-[#161622] border border-[#2A2A3E] rounded-lg px-4 py-3.5 text-white font-mono text-lg placeholder:text-[#475569] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30 transition-colors"
            autoFocus
          />

          {/* Autocomplete dropdown */}
          {results.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-[#161622] border border-[#2A2A3E] rounded-lg overflow-hidden z-50 shadow-2xl">
              {results.slice(0, 8).map(r => (
                <button
                  key={r.symbol}
                  onClick={() => navigate(r.symbol)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#1E1E2E] transition-colors text-left"
                >
                  <span className="font-mono font-bold text-[#7C3AED] w-16">{r.symbol}</span>
                  <span className="text-sm text-[#E2E8F0] flex-1 truncate">{r.name}</span>
                  <span className="text-xs text-[#64748B]">{r.type}</span>
                  <span className="text-xs text-[#475569]">{r.region}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick picks */}
        <div className="flex items-center gap-2 mt-6 flex-wrap justify-center">
          {QUICK_PICKS.map(sym => (
            <button
              key={sym}
              onClick={() => navigate(sym)}
              className="px-3 py-1.5 bg-[#161622] border border-[#2A2A3E] rounded-md text-sm font-mono text-[#A78BFA] hover:bg-[#1E1E2E] hover:border-[#7C3AED] transition-colors"
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-xs text-[#64748B] mb-2 uppercase tracking-wider">Recent</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {recentSearches.map(sym => (
                <button
                  key={sym}
                  onClick={() => navigate(sym)}
                  className="px-2.5 py-1 text-xs font-mono text-[#64748B] hover:text-[#E2E8F0] transition-colors"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function MacroItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-[#64748B]">{label}</span>
      <span className="font-mono text-[#E2E8F0]">{value}</span>
    </div>
  );
}
