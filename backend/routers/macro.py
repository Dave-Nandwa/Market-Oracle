from fastapi import APIRouter
from services.alphavantage import av
import asyncio
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["macro"])


@router.get("/macro")
async def get_macro():
    """
    Fetch macro indicators. Individual metric failures are swallowed and returned
    as None — the endpoint always returns 200 so the frontend doesn't crash.
    Index data (VIX/SPX/COMP) requires an AlphaVantage premium index entitlement;
    they return None gracefully until that's enabled.
    """
    results = await asyncio.gather(
        av.index_data("VIX", "daily"),
        av.index_data("SPX", "daily"),
        av.index_data("COMP", "daily"),
        av.federal_funds_rate("monthly"),
        av.treasury_yield("daily", "10year"),
        av.commodity("WTI", "monthly"),
        av.commodity("BRENT", "monthly"),
        av.commodity("GOLD", "monthly"),
        av.real_gdp("quarterly"),
        av.cpi("monthly"),
        av.unemployment(),
        av.market_status(),
        return_exceptions=True,
    )

    vix_raw, spx_raw, comp_raw, fed_raw, treasury_raw, wti_raw, brent_raw, gold_raw, gdp_raw, cpi_raw, unemp_raw, mstatus_raw = results

    def latest_index(data) -> dict | None:
        if isinstance(data, Exception):
            logger.warning("Index data unavailable: %s", data)
            return None
        ts = data.get("data", [])
        if ts:
            latest = ts[0] if isinstance(ts[0], dict) else {}
            val = latest.get("close") or latest.get("value")
            try:
                return {"date": latest.get("date", ""), "value": float(val)} if val else None
            except (TypeError, ValueError):
                return None
        # Try alternate key format
        for key in data:
            if isinstance(data[key], dict):
                dates = sorted(data[key].keys(), reverse=True)
                if dates:
                    raw = data[key][dates[0]].get("4. close", "")
                    try:
                        return {"date": dates[0], "value": float(raw)} if raw else None
                    except (TypeError, ValueError):
                        return None
        return None

    def latest_series(data) -> dict | None:
        if isinstance(data, Exception):
            logger.warning("Series data unavailable: %s", data)
            return None
        ts = data.get("data", [])
        if ts and isinstance(ts[0], dict):
            val = ts[0].get("value")
            try:
                return {"date": ts[0].get("date", ""), "value": float(val)} if val else None
            except (TypeError, ValueError):
                return None
        return None

    def parse_market_status(data) -> list | None:
        if isinstance(data, Exception):
            logger.warning("Market status unavailable: %s", data)
            return None
        markets = data.get("markets", [])
        if not markets:
            return None
        result = []
        for m in markets:
            result.append({
                "market_type": m.get("market_type", ""),
                "region": m.get("region", ""),
                "exchange_name": m.get("exchange_name", ""),
                "local_open": m.get("local_open", ""),
                "local_close": m.get("local_close", ""),
                "current_status": m.get("current_status", ""),
            })
        return result

    return {
        "vix": latest_index(vix_raw),
        "spx": latest_index(spx_raw),
        "comp": latest_index(comp_raw),
        "fedRate": latest_series(fed_raw),
        "treasury10y": latest_series(treasury_raw),
        "wti": latest_series(wti_raw),
        "brent": latest_series(brent_raw),
        "gold": latest_series(gold_raw),
        "realGDP": latest_series(gdp_raw),
        "cpi": latest_series(cpi_raw),
        "unemployment": latest_series(unemp_raw),
        "marketStatus": parse_market_status(mstatus_raw),
    }
