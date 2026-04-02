// Market Oracle — TypeScript Types

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

export interface ForecastResult {
  point: number[];
  q10: number[];
  q50: number[];
  q90: number[];
  horizon: number;
  source: 'timesfm' | 'mock';
}

export interface VolatilityData {
  symbol: string;
  dates: string[];
  rv5: number[];
  rv10: number[];
  rv20: number[];
  lastRV: number;
  regime: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  autocorrelation: number;
  forecast: ForecastResult;
}

export interface TickerOverview {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  exchange: string;
  currency: string;
  country: string;
  marketCap: string;
  price: string;
  change: string;
  changePct: string;
  volume: string;
  previousClose: string;
  high52week: string;
  low52week: string;
  pe: string;
  forwardPE: string;
  evToEbitda: string;
  priceToBook: string;
  eps: string;
  dividendYield: string;
  beta: string;
  analystTargetPrice: string;
  analystRatingBuy: string;
  analystRatingHold: string;
  analystRatingSell: string;
  revenueGrowthYOY: string;
  earningsGrowthYOY: string;
  profitMargin: string;
  ma50: string;
  ma200: string;
  nextEarnings: string;
}

export interface TechnicalDataPoint {
  date: string;
  [key: string]: number | string;
}

export interface TechnicalIndicators {
  symbol: string;
  rsi: TechnicalDataPoint[];
  macd: TechnicalDataPoint[];
  bbands: TechnicalDataPoint[];
  atr: TechnicalDataPoint[];
  ema20: TechnicalDataPoint[];
  ema50: TechnicalDataPoint[];
  ema200: TechnicalDataPoint[];
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
  overallSentimentScore: number;
  overallSentimentLabel: string;
  tickerSentimentScore: number | null;
  tickerSentimentLabel: string | null;
  relevanceScore: number | null;
}

export interface NewsData {
  symbol: string;
  articles: NewsArticle[];
  aggregateSentiment: {
    score: number;
    label: string;
    count: number;
  };
}

export interface MacroData {
  vix: { date: string; value: string };
  spx: { date: string; value: string };
  comp: { date: string; value: string };
  fedRate: { date: string; value: string };
  treasury10y: { date: string; value: string };
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
  matchScore: number;
}

export type VolRegime = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export const REGIME_COLORS: Record<VolRegime, string> = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  EXTREME: '#EF4444',
};
