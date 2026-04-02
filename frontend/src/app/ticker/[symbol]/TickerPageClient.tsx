'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchOverview, fetchVolatility, fetchTechnicals, fetchNews, fetchOHLCV } from '@/lib/api';
import type { TickerOverview, VolatilityData, TechnicalIndicators, NewsData, OHLCVBar } from '@/lib/types';
import TickerHeader from '@/components/dashboard/TickerHeader';
import VolatilityForecast from '@/components/dashboard/VolatilityForecast';
import TechnicalPanel from '@/components/dashboard/TechnicalPanel';
import FundamentalsPanel from '@/components/dashboard/FundamentalsPanel';
import NewsFeed from '@/components/dashboard/NewsFeed';
import MainChart from '@/components/dashboard/MainChart';
import MacroBar from '@/components/dashboard/MacroBar';

export default function TickerPage() {
  const params = useParams();
  const symbol = (params.symbol as string).toUpperCase();

  const [overview, setOverview] = useState<TickerOverview | null>(null);
  const [volatility, setVolatility] = useState<VolatilityData | null>(null);
  const [technicals, setTechnicals] = useState<TechnicalIndicators | null>(null);
  const [news, setNews] = useState<NewsData | null>(null);
  const [ohlcv, setOHLCV] = useState<OHLCVBar[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    // Fetch core data first
    Promise.all([
      fetchOverview(symbol).then(setOverview).catch(e => setError(e.message)),
      fetchOHLCV(symbol).then(d => setOHLCV(d.bars)).catch(console.error),
    ]);
    // Then fetch heavier data
    fetchVolatility(symbol).then(setVolatility).catch(console.error);
    fetchTechnicals(symbol).then(setTechnicals).catch(console.error);
    fetchNews(symbol).then(setNews).catch(console.error);
  }, [symbol]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#EF4444] font-mono text-lg mb-2">Error loading {symbol}</p>
          <p className="text-[#64748B] text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-10">
      {/* Header */}
      <TickerHeader overview={overview} symbol={symbol} />

      {/* Main content grid */}
      <div className="flex-1 px-4 py-4 space-y-4 max-w-[1800px] mx-auto w-full">

        {/* Row 1: Main price chart + Volatility forecast side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="surface-card p-4">
            <h3 className="text-xs text-[#64748B] uppercase tracking-wider mb-3">Price</h3>
            <MainChart bars={ohlcv} symbol={symbol} />
          </div>
          <div className="surface-card p-4">
            <h3 className="text-xs text-[#64748B] uppercase tracking-wider mb-3">
              Realized Volatility + TimesFM Forecast
            </h3>
            <VolatilityForecast data={volatility} symbol={symbol} />
          </div>
        </div>

        {/* Row 2: Technical indicators */}
        <div className="surface-card p-4">
          <TechnicalPanel data={technicals} symbol={symbol} />
        </div>

        {/* Row 3: Fundamentals + News */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="surface-card p-4">
            <FundamentalsPanel overview={overview} />
          </div>
          <div className="surface-card p-4">
            <NewsFeed data={news} />
          </div>
        </div>
      </div>

      {/* Macro bar fixed at bottom */}
      <MacroBar />
    </div>
  );
}
