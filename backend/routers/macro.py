from fastapi import APIRouter, HTTPException
from services.alphavantage import av
import asyncio

router = APIRouter(prefix="/api", tags=["macro"])


@router.get("/macro")
async def get_macro():
    try:
        vix, spx, comp, fed, treasury = await asyncio.gather(
            av.index_data("VIX", "daily"),
            av.index_data("SPX", "daily"),
            av.index_data("COMP", "daily"),
            av.federal_funds_rate("monthly"),
            av.treasury_yield("daily", "10year"),
        )

        def latest_index(data: dict) -> dict:
            ts = data.get("data", [])
            if ts:
                latest = ts[0] if isinstance(ts[0], dict) else {}
                return {"date": latest.get("date", ""), "value": latest.get("close") or latest.get("value", "")}
            # Try alternate format
            for key in data:
                if isinstance(data[key], dict):
                    dates = sorted(data[key].keys(), reverse=True)
                    if dates:
                        return {"date": dates[0], "value": data[key][dates[0]].get("4. close", "")}
            return {}

        def latest_series(data: dict) -> dict:
            ts = data.get("data", [])
            if ts and isinstance(ts[0], dict):
                return {"date": ts[0].get("date", ""), "value": ts[0].get("value", "")}
            return {}

        return {
            "vix": latest_index(vix),
            "spx": latest_index(spx),
            "comp": latest_index(comp),
            "fedRate": latest_series(fed),
            "treasury10y": latest_series(treasury),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
