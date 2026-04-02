from fastapi import APIRouter, HTTPException
from services.alphavantage import av
from services.volatility import compute_rv, get_regime, compute_autocorrelation, mock_forecast
from typing import Optional

router = APIRouter(prefix="/api/ticker", tags=["ticker"])


def _f(value, default=None) -> Optional[float]:
    """Safely cast AlphaVantage string value to float, stripping % and whitespace."""
    try:
        if value is None or str(value).strip() in ("", "None", "N/A", "-"):
            return default
        return float(str(value).replace("%", "").strip())
    except (ValueError, TypeError):
        return default


def _i(value, default=None) -> Optional[int]:
    """Safely cast to int."""
    v = _f(value)
    return int(v) if v is not None else default


@router.get("/{symbol}/overview")
async def get_overview(symbol: str):
    try:
        overview, quote = await av.overview(symbol), await av.global_quote(symbol)
        gq = quote.get("Global Quote", {})
        # changePct comes as "0.7250%" — strip the %
        change_pct_raw = gq.get("10. change percent", "")
        return {
            "symbol": symbol.upper(),
            "name": overview.get("Name", ""),
            "description": overview.get("Description", ""),
            "sector": overview.get("Sector", ""),
            "industry": overview.get("Industry", ""),
            "exchange": overview.get("Exchange", ""),
            "currency": overview.get("Currency", "USD"),
            "country": overview.get("Country", ""),
            "marketCap": _f(overview.get("MarketCapitalization")),
            "price": _f(gq.get("05. price")),
            "change": _f(gq.get("09. change")),
            "changePct": _f(change_pct_raw),
            "volume": _i(gq.get("06. volume")),
            "previousClose": _f(gq.get("08. previous close")),
            "high52week": _f(overview.get("52WeekHigh")),
            "low52week": _f(overview.get("52WeekLow")),
            "pe": _f(overview.get("PERatio")),
            "forwardPE": _f(overview.get("ForwardPE")),
            "evToEbitda": _f(overview.get("EVToEBITDA")),
            "priceToBook": _f(overview.get("PriceToBookRatio")),
            "eps": _f(overview.get("EPS")),
            "dividendYield": _f(overview.get("DividendYield")),
            "beta": _f(overview.get("Beta")),
            "analystTargetPrice": _f(overview.get("AnalystTargetPrice")),
            "analystRatingBuy": _i(overview.get("AnalystRatingBuy"), 0),
            "analystRatingHold": _i(overview.get("AnalystRatingHold"), 0),
            "analystRatingSell": _i(overview.get("AnalystRatingSell"), 0),
            "revenueGrowthYOY": _f(overview.get("QuarterlyRevenueGrowthYOY")),
            "earningsGrowthYOY": _f(overview.get("QuarterlyEarningsGrowthYOY")),
            "profitMargin": _f(overview.get("ProfitMargin")),
            "ma50": _f(overview.get("50DayMovingAverage")),
            "ma200": _f(overview.get("200DayMovingAverage")),
            "nextEarnings": overview.get("EarningsDate") or None,
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

        # Forecast — use real TimesFM via Modal if configured, else mock
        try:
            import sys
            sys.path.insert(0, "/Users/jarvis/market-oracle-build/modal")
            from client import get_forecast
            modal_result = get_forecast(rv_20, horizon=horizon)
            forecast = modal_result if modal_result else mock_forecast(rv_20, horizon=horizon)
        except Exception:
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
        import asyncio
        results = await asyncio.gather(
            av.rsi(symbol),
            av.macd(symbol),
            av.bbands(symbol),
            av.atr(symbol),
            av.ema(symbol, time_period=20),
            av.ema(symbol, time_period=50),
            av.ema(symbol, time_period=200),
            av.adx(symbol),
            av.obv(symbol),
            av.stoch(symbol),
            av.mfi(symbol),
            return_exceptions=True,
        )
        rsi_data, macd_data, bb_data, atr_data, ema20, ema50, ema200, adx_data, obv_data, stoch_data, mfi_data = results

        def extract(data, key: str, n: int = 100) -> list[dict]:
            if isinstance(data, Exception):
                return []
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
            "adx": extract(adx_data, "ADX"),
            "obv": extract(obv_data, "OBV"),
            "stoch": extract(stoch_data, "STOCH"),
            "mfi": extract(mfi_data, "MFI"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/financials")
async def get_financials(symbol: str):
    import asyncio
    try:
        income_data, balance_data, cashflow_data = await asyncio.gather(
            av.income_statement(symbol),
            av.balance_sheet(symbol),
            av.cash_flow(symbol),
            return_exceptions=True,
        )

        def safe_float(v):
            try:
                if v is None or str(v).strip() in ("", "None", "N/A", "-"):
                    return None
                return float(str(v).replace(",", "").strip())
            except (ValueError, TypeError):
                return None

        def parse_income(reports):
            if isinstance(reports, Exception) or not isinstance(reports, dict):
                return []
            quarters = reports.get("quarterlyReports", [])[:8]
            result = []
            for q in quarters:
                rev = safe_float(q.get("totalRevenue"))
                gross = safe_float(q.get("grossProfit"))
                op_inc = safe_float(q.get("operatingIncome"))
                net = safe_float(q.get("netIncome"))
                ebitda = safe_float(q.get("ebitda"))
                eps = safe_float(q.get("reportedEPS"))
                eps_dil = safe_float(q.get("dilutedEPS"))
                result.append({
                    "date": q.get("fiscalDateEnding", ""),
                    "revenue": rev,
                    "grossProfit": gross,
                    "operatingIncome": op_inc,
                    "netIncome": net,
                    "ebitda": ebitda,
                    "eps": eps,
                    "epsDiluted": eps_dil,
                })
            return result

        def parse_balance(reports):
            if isinstance(reports, Exception) or not isinstance(reports, dict):
                return []
            quarters = reports.get("quarterlyReports", [])[:8]
            result = []
            for q in quarters:
                result.append({
                    "date": q.get("fiscalDateEnding", ""),
                    "totalAssets": safe_float(q.get("totalAssets")),
                    "totalLiabilities": safe_float(q.get("totalLiabilities")),
                    "totalEquity": safe_float(q.get("totalShareholderEquity")),
                    "cash": safe_float(q.get("cashAndCashEquivalentsAtCarryingValue")),
                    "longTermDebt": safe_float(q.get("longTermDebt")),
                })
            return result

        def parse_cashflow(reports):
            if isinstance(reports, Exception) or not isinstance(reports, dict):
                return []
            quarters = reports.get("quarterlyReports", [])[:8]
            result = []
            for q in quarters:
                op_cf = safe_float(q.get("operatingCashflow"))
                capex = safe_float(q.get("capitalExpenditures"))
                free_cf = (op_cf - abs(capex)) if op_cf is not None and capex is not None else None
                result.append({
                    "date": q.get("fiscalDateEnding", ""),
                    "operatingCashflow": op_cf,
                    "capex": -abs(capex) if capex is not None else None,
                    "freeCashflow": free_cf,
                    "dividendPayout": safe_float(q.get("dividendPayout")),
                })
            return result

        return {
            "symbol": symbol.upper(),
            "income": parse_income(income_data),
            "balance": parse_balance(balance_data),
            "cashflow": parse_cashflow(cashflow_data),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/earnings")
async def get_earnings(symbol: str):
    try:
        data = await av.earnings(symbol)
        quarters = data.get("quarterlyEarnings", [])[:8]
        result = []
        for q in quarters:
            def sf(v):
                try:
                    if v is None or str(v).strip() in ("", "None", "N/A", "-"):
                        return None
                    return float(str(v).strip())
                except (ValueError, TypeError):
                    return None
            reported = sf(q.get("reportedEPS"))
            estimated = sf(q.get("estimatedEPS"))
            surprise = sf(q.get("surprise"))
            surprise_pct = sf(q.get("surprisePercentage"))
            result.append({
                "date": q.get("fiscalDateEnding", ""),
                "reported": reported,
                "estimated": estimated,
                "surprise": surprise,
                "surprisePct": surprise_pct,
            })
        return {"symbol": symbol.upper(), "quarters": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/insiders")
async def get_insiders(symbol: str):
    try:
        data = await av.insider_transactions(symbol)
        transactions_raw = data.get("data", [])[:10]
        result = []
        for t in transactions_raw:
            def sf(v):
                try:
                    if v is None or str(v).strip() in ("", "None", "N/A", "-"):
                        return None
                    return float(str(v).replace(",", "").strip())
                except (ValueError, TypeError):
                    return None
            shares = sf(t.get("shares"))
            price = sf(t.get("share_price"))
            value = (shares * price) if shares is not None and price is not None else None
            result.append({
                "executive": t.get("executive_title") or t.get("name") or "",
                "shares": int(shares) if shares is not None else 0,
                "type": "Buy" if str(t.get("acquisition_or_disposal", "")).upper() == "A" else "Sell",
                "price": price,
                "date": t.get("transaction_date") or t.get("date") or "",
                "value": value,
            })
        return {"symbol": symbol.upper(), "transactions": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
