# 🔮 Market Oracle

> Quant-grade, asset-agnostic financial analytics platform powered by **Google TimesFM** + **AlphaVantage**.

![Market Oracle](https://via.placeholder.com/1200x600/0D0D14/7C3AED?text=MARKET+ORACLE)

## What It Is

Market Oracle is a Bloomberg Terminal-inspired analytics dashboard that brings quant-level financial analysis to any ticker — stocks, ETFs, crypto, forex, commodities.

**The key innovation:** Volatility clustering prediction using Google's TimesFM (200M param decoder-only transformer). If volatility is high today, it's very likely high tomorrow — TimesFM forecasts realized volatility 1-5 days ahead with quantile uncertainty bands.

## Architecture

```
market-oracle/
├── frontend/      Next.js 14 + shadcn/ui + Custom SVG charts
│                  Kraken-inspired Bloomberg dark design system
├── backend/       Python FastAPI + AlphaVantage client + RV computation
├── modal/         TimesFM GPU inference on Modal (google/timesfm-2.0-500m-pytorch)
└── shared/        TypeScript types
```

## Features

- 📈 **Price Charts** — Daily OHLCV with 90-day candlestick view
- 🌊 **Volatility Forecast** — Realized volatility (5d/10d/20d) + TimesFM 1-5 day forecast cone with q10/q50/q90 quantile bands
- 📊 **Technical Indicators** — RSI, MACD, Bollinger Bands (tabbed, visual charts)
- 🏢 **Fundamentals** — P/E, EPS, revenue growth, analyst ratings, moving averages
- 📰 **News Sentiment** — Latest news with AI sentiment scores (Bullish/Bearish/Neutral)
- 🌍 **Macro Context** — VIX, S&P500, NASDAQ, Fed Rate, 10Y Yield
- 🔍 **Universal Search** — Any ticker: stocks, ETFs, crypto, forex
- ⚡ **Asset Agnostic** — Works on equities, crypto (BTC/ETH), FX pairs

## Volatility Clustering

The core insight: **volatility clusters**. If vol is high today, it will likely be high tomorrow.

```
Realized Vol (RV) = std(log(P_t/P_{t-1}), window=20) × √252  (annualized)
TimesFM input: last 512 days of RV series
Output: 5-day forecast with q10/q50/q90 quantile bands
```

Regimes: `LOW` (<10%) · `MEDIUM` (10-20%) · `HIGH` (20-35%) · `EXTREME` (>35%)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- AlphaVantage API key
- Modal account (for GPU inference — mock forecasts work without it)

### 1. Frontend
```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add your ALPHAVANTAGE_API_KEY
uvicorn main:app --reload --port 8000
```

### 3. Modal (TimesFM GPU inference)
```bash
pip install modal
modal token new   # authenticate
modal deploy modal/timesfm_inference.py

# Add to backend/.env:
MODAL_TOKEN_ID=your_token_id
MODAL_TOKEN_SECRET=your_token_secret
```

Without Modal tokens, the app uses mock forecasts (realistic but not real TimesFM).

## Environment Variables

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**backend/.env**
```
ALPHAVANTAGE_API_KEY=your_key_here
MODAL_TOKEN_ID=           # optional - for real TimesFM
MODAL_TOKEN_SECRET=       # optional - for real TimesFM
```

## API Endpoints

```
GET /api/ticker/{symbol}/overview     Company info + live quote
GET /api/ticker/{symbol}/ohlcv        Daily OHLCV bars
GET /api/ticker/{symbol}/volatility   RV series + TimesFM forecast
GET /api/ticker/{symbol}/technicals   RSI, MACD, BBANDS, ATR, EMA
GET /api/ticker/{symbol}/news         News with sentiment scores
GET /api/macro                        VIX, SPX, COMP, FED, 10Y
GET /api/search?q={query}            Ticker autocomplete search
```

## Data Sources

- **Price/Fundamentals/Technical:** [AlphaVantage](https://www.alphavantage.co) (100,000+ global symbols)
- **ML Forecasting:** [Google TimesFM 2.0](https://huggingface.co/google/timesfm-2.0-500m-pytorch) (200M params, zero-shot)
- **GPU Inference:** [Modal](https://modal.com) (T4 GPU, on-demand)

## Design System

Bloomberg Terminal energy — data-dense, dark, professional.
Based on the **Kraken** design system (dark dashboard, purple-accented, data-dense).

- Background: `#0D0D14` · Surface: `#161622` · Border: `#2A2A3E`
- Accent: `#7C3AED` (Kraken purple) · Green: `#10B981` · Red: `#EF4444`

## Built With

Next.js 14 · TypeScript · Tailwind CSS · FastAPI · NumPy · Pandas · Modal · TimesFM · AlphaVantage API

---

Built by [David Nandwa](https://linkedin.com/in/davidnandwa) + Jarvis AI
