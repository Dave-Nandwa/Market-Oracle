"""
AlphaVantage API client — async, rate-limited, cached.
"""
import asyncio
import time
import os
from typing import Any, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://www.alphavantage.co/query"
API_KEY = os.getenv("ALPHAVANTAGE_API_KEY", "demo")

# Simple in-memory TTL cache
_cache: dict[str, tuple[Any, float]] = {}
CACHE_TTL = {
    "quote": 60,          # 1 minute
    "daily": 21600,       # 6 hours
    "indicator": 21600,   # 6 hours
    "overview": 86400,    # 24 hours
    "news": 900,          # 15 minutes
    "macro": 900,         # 15 minutes
    "search": 3600,       # 1 hour
}

_last_request_time = 0.0
RATE_LIMIT_DELAY = 0.25  # 250ms between requests = max 4/sec (well under 5/sec limit)

# Semaphore ensures only 1 request fires at a time — prevents burst pattern errors
# Lazily initialized to avoid issues when there's no running event loop at import time
_request_semaphore = None  # type: Optional[asyncio.Semaphore]


def _get_semaphore() -> asyncio.Semaphore:
    global _request_semaphore
    if _request_semaphore is None:
        _request_semaphore = asyncio.Semaphore(1)
    return _request_semaphore


async def _request(params: dict, cache_key: str, ttl_type: str = "daily") -> dict:
    global _last_request_time

    # Check cache (no lock needed — reads are safe)
    if cache_key in _cache:
        data, expires_at = _cache[cache_key]
        if time.time() < expires_at:
            return data

    async with _get_semaphore():
        # Re-check cache after acquiring lock (another coroutine may have fetched it)
        if cache_key in _cache:
            data, expires_at = _cache[cache_key]
            if time.time() < expires_at:
                return data

        # Rate limit — ensure minimum gap between requests
        elapsed = time.time() - _last_request_time
        if elapsed < RATE_LIMIT_DELAY:
            await asyncio.sleep(RATE_LIMIT_DELAY - elapsed)

        params["apikey"] = API_KEY

        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(BASE_URL, params=params)
            r.raise_for_status()
            data = r.json()

        _last_request_time = time.time()

        # Check for rate limit or error responses
        if "Information" in data or "Note" in data:
            raise Exception(f"AlphaVantage rate limit hit: {data.get('Information') or data.get('Note')}")
        if "Error Message" in data:
            raise Exception(f"AlphaVantage error: {data['Error Message']}")

        ttl = CACHE_TTL.get(ttl_type, 3600)
        _cache[cache_key] = (data, time.time() + ttl)
        return data


class AlphaVantage:

    # ── Core Time Series ────────────────────────────────────────────────────

    async def daily_adjusted(self, symbol: str, outputsize: str = "full") -> dict:
        return await _request(
            {"function": "TIME_SERIES_DAILY_ADJUSTED", "symbol": symbol, "outputsize": outputsize},
            cache_key=f"daily_adj:{symbol}:{outputsize}",
            ttl_type="daily",
        )

    async def global_quote(self, symbol: str) -> dict:
        return await _request(
            {"function": "GLOBAL_QUOTE", "symbol": symbol},
            cache_key=f"quote:{symbol}",
            ttl_type="quote",
        )

    async def symbol_search(self, keywords: str) -> dict:
        return await _request(
            {"function": "SYMBOL_SEARCH", "keywords": keywords},
            cache_key=f"search:{keywords}",
            ttl_type="search",
        )

    # ── Fundamentals ────────────────────────────────────────────────────────

    async def overview(self, symbol: str) -> dict:
        return await _request(
            {"function": "OVERVIEW", "symbol": symbol},
            cache_key=f"overview:{symbol}",
            ttl_type="overview",
        )

    async def earnings(self, symbol: str) -> dict:
        return await _request(
            {"function": "EARNINGS", "symbol": symbol},
            cache_key=f"earnings:{symbol}",
            ttl_type="overview",
        )

    # ── Technical Indicators ─────────────────────────────────────────────────

    async def rsi(self, symbol: str, interval: str = "daily", time_period: int = 14) -> dict:
        return await _request(
            {"function": "RSI", "symbol": symbol, "interval": interval,
             "time_period": time_period, "series_type": "close"},
            cache_key=f"rsi:{symbol}:{interval}:{time_period}",
            ttl_type="indicator",
        )

    async def macd(self, symbol: str, interval: str = "daily") -> dict:
        return await _request(
            {"function": "MACD", "symbol": symbol, "interval": interval, "series_type": "close"},
            cache_key=f"macd:{symbol}:{interval}",
            ttl_type="indicator",
        )

    async def bbands(self, symbol: str, interval: str = "daily", time_period: int = 20) -> dict:
        return await _request(
            {"function": "BBANDS", "symbol": symbol, "interval": interval,
             "time_period": time_period, "series_type": "close"},
            cache_key=f"bbands:{symbol}:{interval}:{time_period}",
            ttl_type="indicator",
        )

    async def atr(self, symbol: str, interval: str = "daily", time_period: int = 14) -> dict:
        return await _request(
            {"function": "ATR", "symbol": symbol, "interval": interval, "time_period": time_period},
            cache_key=f"atr:{symbol}:{interval}:{time_period}",
            ttl_type="indicator",
        )

    async def ema(self, symbol: str, interval: str = "daily", time_period: int = 20) -> dict:
        return await _request(
            {"function": "EMA", "symbol": symbol, "interval": interval,
             "time_period": time_period, "series_type": "close"},
            cache_key=f"ema:{symbol}:{interval}:{time_period}",
            ttl_type="indicator",
        )

    # ── Financial Statements ─────────────────────────────────────────────────

    async def income_statement(self, symbol: str) -> dict:
        return await _request(
            {"function": "INCOME_STATEMENT", "symbol": symbol},
            cache_key=f"income_stmt:{symbol}",
            ttl_type="overview",
        )

    async def balance_sheet(self, symbol: str) -> dict:
        return await _request(
            {"function": "BALANCE_SHEET", "symbol": symbol},
            cache_key=f"balance_sheet:{symbol}",
            ttl_type="overview",
        )

    async def cash_flow(self, symbol: str) -> dict:
        return await _request(
            {"function": "CASH_FLOW", "symbol": symbol},
            cache_key=f"cash_flow:{symbol}",
            ttl_type="overview",
        )

    # ── Alpha Intelligence ────────────────────────────────────────────────────

    async def insider_transactions(self, symbol: str) -> dict:
        return await _request(
            {"function": "INSIDER_TRANSACTIONS", "symbol": symbol},
            cache_key=f"insiders:{symbol}",
            ttl_type="overview",
        )

    async def top_gainers_losers(self) -> dict:
        return await _request(
            {"function": "TOP_GAINERS_LOSERS"},
            cache_key="top_gainers_losers",
            ttl_type="news",
        )

    async def news_sentiment(self, tickers: str, limit: int = 20) -> dict:
        return await _request(
            {"function": "NEWS_SENTIMENT", "tickers": tickers, "sort": "LATEST", "limit": limit},
            cache_key=f"news:{tickers}:{limit}",
            ttl_type="news",
        )

    # ── Technical Indicators (new) ───────────────────────────────────────────

    async def adx(self, symbol: str, interval: str = "daily", time_period: int = 14) -> dict:
        return await _request(
            {"function": "ADX", "symbol": symbol, "interval": interval, "time_period": time_period},
            cache_key=f"adx:{symbol}:{interval}:{time_period}",
            ttl_type="indicator",
        )

    async def obv(self, symbol: str, interval: str = "daily") -> dict:
        return await _request(
            {"function": "OBV", "symbol": symbol, "interval": interval},
            cache_key=f"obv:{symbol}:{interval}",
            ttl_type="indicator",
        )

    async def stoch(self, symbol: str, interval: str = "daily") -> dict:
        return await _request(
            {"function": "STOCH", "symbol": symbol, "interval": interval},
            cache_key=f"stoch:{symbol}:{interval}",
            ttl_type="indicator",
        )

    async def mfi(self, symbol: str, interval: str = "daily", time_period: int = 14) -> dict:
        return await _request(
            {"function": "MFI", "symbol": symbol, "interval": interval, "time_period": time_period},
            cache_key=f"mfi:{symbol}:{interval}:{time_period}",
            ttl_type="indicator",
        )

    # ── Economic Indicators ───────────────────────────────────────────────────

    async def real_gdp(self, interval: str = "quarterly") -> dict:
        return await _request(
            {"function": "REAL_GDP", "interval": interval},
            cache_key=f"real_gdp:{interval}",
            ttl_type="macro",
        )

    async def cpi(self, interval: str = "monthly") -> dict:
        return await _request(
            {"function": "CPI", "interval": interval},
            cache_key=f"cpi:{interval}",
            ttl_type="macro",
        )

    async def unemployment(self) -> dict:
        return await _request(
            {"function": "UNEMPLOYMENT"},
            cache_key="unemployment",
            ttl_type="macro",
        )

    async def nonfarm_payroll(self) -> dict:
        return await _request(
            {"function": "NONFARM_PAYROLL"},
            cache_key="nonfarm_payroll",
            ttl_type="macro",
        )

    # ── Market Status ─────────────────────────────────────────────────────────

    async def market_status(self) -> dict:
        return await _request(
            {"function": "MARKET_STATUS"},
            cache_key="market_status",
            ttl_type="news",
        )

    # ── Commodities ───────────────────────────────────────────────────────────

    async def commodity(self, name: str, interval: str = "monthly") -> dict:
        return await _request(
            {"function": name, "interval": interval},
            cache_key=f"commodity:{name}:{interval}",
            ttl_type="macro",
        )

    # ── Index Data (Premium) ─────────────────────────────────────────────────

    async def index_data(self, symbol: str, interval: str = "daily") -> dict:
        return await _request(
            {"function": "INDEX_DATA", "symbol": symbol, "interval": interval},
            cache_key=f"index:{symbol}:{interval}",
            ttl_type="macro",
        )

    # ── Economic Indicators ───────────────────────────────────────────────────

    async def treasury_yield(self, interval: str = "daily", maturity: str = "10year") -> dict:
        return await _request(
            {"function": "TREASURY_YIELD", "interval": interval, "maturity": maturity},
            cache_key=f"treasury:{interval}:{maturity}",
            ttl_type="macro",
        )

    async def federal_funds_rate(self, interval: str = "monthly") -> dict:
        return await _request(
            {"function": "FEDERAL_FUNDS_RATE", "interval": interval},
            cache_key=f"fed_funds:{interval}",
            ttl_type="macro",
        )

    # ── Crypto ────────────────────────────────────────────────────────────────

    async def crypto_daily(self, symbol: str, market: str = "USD") -> dict:
        return await _request(
            {"function": "DIGITAL_CURRENCY_DAILY", "symbol": symbol, "market": market},
            cache_key=f"crypto_daily:{symbol}:{market}",
            ttl_type="daily",
        )

    async def crypto_exchange_rate(self, from_currency: str, to_currency: str = "USD") -> dict:
        return await _request(
            {"function": "CURRENCY_EXCHANGE_RATE", "from_currency": from_currency, "to_currency": to_currency},
            cache_key=f"crypto_rate:{from_currency}:{to_currency}",
            ttl_type="quote",
        )


# Singleton
av = AlphaVantage()
