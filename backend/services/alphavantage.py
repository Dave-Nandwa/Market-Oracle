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
RATE_LIMIT_DELAY = 0.3  # 300ms between requests


async def _request(params: dict, cache_key: str, ttl_type: str = "daily") -> dict:
    global _last_request_time

    # Check cache
    if cache_key in _cache:
        data, expires_at = _cache[cache_key]
        if time.time() < expires_at:
            return data

    # Rate limit
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

    # ── Alpha Intelligence ────────────────────────────────────────────────────

    async def news_sentiment(self, tickers: str, limit: int = 20) -> dict:
        return await _request(
            {"function": "NEWS_SENTIMENT", "tickers": tickers, "sort": "LATEST", "limit": limit},
            cache_key=f"news:{tickers}:{limit}",
            ttl_type="news",
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
