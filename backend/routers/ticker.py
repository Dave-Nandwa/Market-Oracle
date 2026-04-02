from fastapi import APIRouter, HTTPException
from services.alphavantage import av
from services.volatility import compute_rv, get_regime, compute_autocorrelation, mock_forecast

router = APIRouter(prefix="/api/ticker", tags=["ticker"])


@router.get("/{symbol}/overview")
async def get_overview(symbol: str):
    try:
        overview, quote = await av.overview(symbol), await av.global_quote(symbol)
        gq = quote.get("Global Quote", {})
        return {
            "symbol": symbol.upper(),
            "name": overview.get("Name", ""),
            "description": overview.get("Description", ""),
            "sector": overview.get("Sector", ""),
            "industry": overview.get("Industry", ""),
            "exchange": overview.get("Exchange", ""),
            "currency": overview.get("Currency", "USD"),
            "country": overview.get("Country", ""),
            "marketCap": overview.get("MarketCapitalization", ""),
            "price": gq.get("05. price", ""),
            "change": gq.get("09. change", ""),
            "changePct": gq.get("10. change percent", ""),
            "volume": gq.get("06. volume", ""),
            "previousClose": gq.get("08. previous close", ""),
            "high52week": overview.get("52WeekHigh", ""),
            "low52week": overview.get("52WeekLow", ""),
            "pe": overview.get("PERatio", ""),
            "forwardPE": overview.get("ForwardPE", ""),
            "evToEbitda": overview.get("EVToEBITDA", ""),
            "priceToBook": overview.get("PriceToBookRatio", ""),
            "eps": overview.get("EPS", ""),
            "dividendYield": overview.get("DividendYield", ""),
            "beta": overview.get("Beta", ""),
            "analystTargetPrice": overview.get("AnalystTargetPrice", ""),
            "analystRatingBuy": overview.get("AnalystRatingBuy", ""),
            "analystRatingHold": overview.get("AnalystRatingHold", ""),
            "analystRatingSell": overview.get("AnalystRatingSell", ""),
            "revenueGrowthYOY": overview.get("QuarterlyRevenueGrowthYOY", ""),
            "earningsGrowthYOY": overview.get("QuarterlyEarningsGrowthYOY", ""),
            "profitMargin": overview.get("ProfitMargin", ""),
            "ma50": overview.get("50DayMovingAverage", ""),
            "ma200": overview.get("200DayMovingAverage", ""),
            "nextEarnings": overview.get("EarningsDate", ""),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/ohlcv")
async def get_ohlcv(symbol: str, outputsize: str = "compact"):
    try:
        data = await av.daily_adjusted(symbol, outputsize=outputsize)
        ts = data.get("Time Series (Daily)", {})
        bars = []
        for date in sorted(ts.keys()):
            bar = ts[date]
            bars.append({
                "date": date,
                "open": float(bar["1. open"]),
                "high": float(bar["2. high"]),
                "low": float(bar["3. low"]),
                "close": float(bar["4. close"]),
                "adjClose": float(bar["5. adjusted close"]),
                "volume": int(bar["6. volume"]),
            })
        return {"symbol": symbol.upper(), "bars": bars}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/volatility")
async def get_volatility(symbol: str, horizon: int = 5):
    try:
        data = await av.daily_adjusted(symbol, outputsize="full")
        ts = data.get("Time Series (Daily)", {})
        sorted_dates = sorted(ts.keys())
        closes = [float(ts[d]["5. adjusted close"]) for d in sorted_dates]

        rv_5 = compute_rv(closes, window=5)
        rv_10 = compute_rv(closes, window=10)
        rv_20 = compute_rv(closes, window=20)

        # Align dates to the shortest RV series (rv_20)
        offset = len(closes) - len(rv_20)
        rv_dates = sorted_dates[offset:]

        last_rv = rv_20[-1] if rv_20 else 0.18
        regime = get_regime(last_rv)
        autocorr = compute_autocorrelation(rv_20)

        # Forecast (mock until Modal tokens configured)
        forecast = mock_forecast(rv_20, horizon=horizon)

        return {
            "symbol": symbol.upper(),
            "dates": rv_dates,
            "rv5": rv_5[len(rv_5) - len(rv_20):],
            "rv10": rv_10[len(rv_10) - len(rv_20):],
            "rv20": rv_20,
            "lastRV": round(last_rv, 4),
            "regime": regime,
            "autocorrelation": round(autocorr, 4),
            "forecast": forecast,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/technicals")
async def get_technicals(symbol: str):
    try:
        rsi_data, macd_data, bb_data, atr_data, ema20, ema50, ema200 = await _gather_technicals(symbol)

        def extract(data: dict, key: str, n: int = 100) -> list[dict]:
            ts = data.get(f"Technical Analysis: {key}", {})
            items = []
            for date in sorted(ts.keys())[-n:]:
                row = {"date": date}
                row.update({k: float(v) for k, v in ts[date].items()})
                items.append(row)
            return items

        return {
            "symbol": symbol.upper(),
            "rsi": extract(rsi_data, "RSI"),
            "macd": extract(macd_data, "MACD"),
            "bbands": extract(bb_data, "BBANDS"),
            "atr": extract(atr_data, "ATR"),
            "ema20": extract(ema20, "EMA"),
            "ema50": extract(ema50, "EMA"),
            "ema200": extract(ema200, "EMA"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _gather_technicals(symbol: str):
    import asyncio
    return await asyncio.gather(
        av.rsi(symbol),
        av.macd(symbol),
        av.bbands(symbol),
        av.atr(symbol),
        av.ema(symbol, time_period=20),
        av.ema(symbol, time_period=50),
        av.ema(symbol, time_period=200),
    )
