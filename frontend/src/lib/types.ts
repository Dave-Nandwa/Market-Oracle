export interface OHLCVBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  adjClose: number
  volume: number
}

export interface ForecastResult {
  point: number[]
  q10: number[]
  q50: number[]
  q90: number[]
  horizon: number
  source: "timesfm" | "mock"
}

export type VolatilityRegime = "LOW" | "MEDIUM" | "HIGH" | "EXTREME"

export interface VolatilityData {
  symbol: string
  dates: string[]
  rv5: number[]
  rv10: number[]
  rv20: number[]
  lastRV: number
  regime: VolatilityRegime
  autocorrelation: number
  forecast: ForecastResult
}

export interface TickerOverview {
  symbol: string
  name: string
  description: string
  sector: string
  industry: string
  exchange: string
  currency: string
  country: string
  marketCap: number
  price: number
  change: number
  changePct: number
  volume: number
  previousClose: number
  high52week: number
  low52week: number
  pe: number | null
  forwardPE: number | null
  evToEbitda: number | null
  priceToBook: number | null
  eps: number | null
  dividendYield: number | null
  beta: number | null
  analystTargetPrice: number | null
  analystRatingBuy: number
  analystRatingHold: number
  analystRatingSell: number
  revenueGrowthYOY: number | null
  earningsGrowthYOY: number | null
  profitMargin: number | null
  ma50: number | null
  ma200: number | null
  nextEarnings: string | null
}

export interface TechnicalDataPoint {
  date: string
  [key: string]: number | string
}

export interface TechnicalIndicators {
  symbol: string
  rsi: TechnicalDataPoint[]
  macd: TechnicalDataPoint[]
  bbands: TechnicalDataPoint[]
  atr: TechnicalDataPoint[]
  ema20: TechnicalDataPoint[]
  ema50: TechnicalDataPoint[]
  ema200: TechnicalDataPoint[]
  adx: TechnicalDataPoint[]
  obv: TechnicalDataPoint[]
  stoch: TechnicalDataPoint[]
  mfi: TechnicalDataPoint[]
}

export interface NewsArticle {
  title: string
  url: string
  source: string
  publishedAt: string
  summary: string
  overallSentimentScore: number
  overallSentimentLabel: string
  tickerSentimentScore: number
  tickerSentimentLabel: string
  relevanceScore: number
}

export interface NewsData {
  symbol: string
  articles: NewsArticle[]
  aggregateSentiment: {
    score: number
    label: string
    count: number
  }
}

export interface MacroMetric {
  date: string
  value: number
}

export interface MacroData {
  vix: MacroMetric | null
  spx: MacroMetric | null
  comp: MacroMetric | null
  fedRate: MacroMetric | null
  treasury10y: MacroMetric | null
  gold: MacroMetric | null
  wti: MacroMetric | null
  brent: MacroMetric | null
  realGDP: MacroMetric | null
  cpi: MacroMetric | null
  unemployment: MacroMetric | null
  marketStatus: Array<{
    market_type: string
    region: string
    exchange_name: string
    local_open?: string
    local_close?: string
    current_status: string
  }> | null
}

export interface FinancialStatement {
  date: string
  revenue?: number | null
  grossProfit?: number | null
  operatingIncome?: number | null
  netIncome?: number | null
  ebitda?: number | null
  eps?: number | null
  epsDiluted?: number | null
  totalAssets?: number | null
  totalLiabilities?: number | null
  totalEquity?: number | null
  cash?: number | null
  longTermDebt?: number | null
  operatingCashflow?: number | null
  capex?: number | null
  freeCashflow?: number | null
  dividendPayout?: number | null
}

export interface FinancialsData {
  symbol: string
  income: FinancialStatement[]
  balance: FinancialStatement[]
  cashflow: FinancialStatement[]
}

export interface EarningsQuarter {
  date: string
  reported: number | null
  estimated: number | null
  surprise: number | null
  surprisePct: number | null
}

export interface EarningsData {
  symbol: string
  quarters: EarningsQuarter[]
}

export interface InsiderTransaction {
  executive: string
  shares: number
  type: string
  price: number | null
  date: string
  value: number | null
}

export interface InsidersData {
  symbol: string
  transactions: InsiderTransaction[]
}

export interface MarketMover {
  ticker: string
  price: string
  change: string
  volume: string
}

export interface MarketMovers {
  gainers: MarketMover[]
  losers: MarketMover[]
  mostActive: MarketMover[]
}

export interface SearchResult {
  symbol: string
  name: string
  type: string
  region: string
  currency: string
  matchScore: number
}
