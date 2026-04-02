from fastapi import APIRouter, HTTPException, Query
from services.alphavantage import av

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search")
async def search_tickers(q: str = Query(..., min_length=1)):
    try:
        data = await av.symbol_search(q)
        matches = data.get("bestMatches", [])
        return {
            "results": [
                {
                    "symbol": m.get("1. symbol", ""),
                    "name": m.get("2. name", ""),
                    "type": m.get("3. type", ""),
                    "region": m.get("4. region", ""),
                    "currency": m.get("8. currency", ""),
                    "matchScore": float(m.get("9. matchScore", 0)),
                }
                for m in matches
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
