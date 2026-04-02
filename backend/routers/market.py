from fastapi import APIRouter
from services.alphavantage import av
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/movers")
async def get_market_movers():
    try:
        data = await av.top_gainers_losers()

        def parse_movers(items: list) -> list:
            result = []
            for item in items[:10]:
                result.append({
                    "ticker": item.get("ticker", ""),
                    "price": item.get("price", ""),
                    "change": item.get("change_percentage", ""),
                    "volume": item.get("volume", ""),
                })
            return result

        return {
            "gainers": parse_movers(data.get("top_gainers", [])),
            "losers": parse_movers(data.get("top_losers", [])),
            "mostActive": parse_movers(data.get("most_actively_traded", [])),
        }
    except Exception as e:
        logger.warning("Market movers unavailable: %s", e)
        return {"gainers": [], "losers": [], "mostActive": []}
