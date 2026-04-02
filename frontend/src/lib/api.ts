import type {
  TickerOverview,
  OHLCVBar,
  VolatilityData,
  TechnicalIndicators,
  NewsData,
  MacroData,
  SearchResult,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://market-oracle-api-production.up.railway.app';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export const fetchOverview = (symbol: string) =>
  apiFetch<TickerOverview>(`/api/ticker/${symbol}/overview`);

export const fetchOHLCV = (symbol: string, outputsize: 'compact' | 'full' = 'compact') =>
  apiFetch<{ symbol: string; bars: OHLCVBar[] }>(`/api/ticker/${symbol}/ohlcv?outputsize=${outputsize}`);

export const fetchVolatility = (symbol: string, horizon = 5) =>
  apiFetch<VolatilityData>(`/api/ticker/${symbol}/volatility?horizon=${horizon}`);

export const fetchTechnicals = (symbol: string) =>
  apiFetch<TechnicalIndicators>(`/api/ticker/${symbol}/technicals`);

export const fetchNews = (symbol: string, limit = 20) =>
  apiFetch<NewsData>(`/api/ticker/${symbol}/news?limit=${limit}`);

export const fetchMacro = () =>
  apiFetch<MacroData>('/api/macro');

export const searchTickers = async (q: string): Promise<SearchResult[]> => {
  if (!q || q.length < 1) return [];
  const data = await apiFetch<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`);
  return data.results;
};
