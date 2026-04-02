# AGENTS.md — Market Oracle

## Monorepo Structure

```
frontend/   Next.js 14 + TypeScript + Tailwind + shadcn/ui
backend/    Python FastAPI + AlphaVantage + RV computation  
modal/      TimesFM GPU inference (Modal deployment)
shared/     Shared types (future)
```

## Running the Project

```bash
# Frontend (port 3000)
cd frontend && npm install && npm run dev

# Backend (port 8000)
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Both need to run simultaneously
```

## Key Files

- `frontend/src/lib/api.ts` — all API calls to backend
- `frontend/src/lib/types.ts` — TypeScript interfaces
- `frontend/src/components/dashboard/VolatilityForecast.tsx` — THE hero component
- `backend/services/alphavantage.py` — AlphaVantage client (rate-limited, cached)
- `backend/services/volatility.py` — RV computation + mock forecast
- `backend/routers/ticker.py` — main data endpoints
- `modal/timesfm_inference.py` — TimesFM Modal function

## AlphaVantage

Key: stored in `backend/.env` as `ALPHAVANTAGE_API_KEY`
Rate limit: 25 req/day (free), 5 req/min. Backend handles caching automatically.

## Modal / TimesFM

- Deploy: `modal deploy modal/timesfm_inference.py`
- Without Modal tokens → mock forecasts are used (realistic, not real AI)
- Add `MODAL_TOKEN_ID` + `MODAL_TOKEN_SECRET` to `backend/.env` to enable

## Design Rules

- Dark theme ALWAYS — never light mode
- Background: `#0D0D14`, Surface: `#161622`
- Purple accent: `#7C3AED` (Kraken design system)
- Numbers: always use monospace font
- Dense layout: `p-3` not `p-6`, `text-xs` for labels
