from fastapi import APIRouter, HTTPException
from services.alphavantage import av

router = APIRouter(prefix="/api/ticker", tags=["intelligence"])


@router.get("/{symbol}/news")
async def get_news(symbol: str, limit: int = 20):
    try:
        data = await av.news_sentiment(symbol, limit=limit)
        articles = data.get("feed", [])
        result = []
        for a in articles:
            ticker_sentiment = next(
                (t for t in a.get("ticker_sentiment", []) if t["ticker"] == symbol.upper()),
                None,
            )
            result.append({
                "title": a.get("title", ""),
                "url": a.get("url", ""),
                "source": a.get("source", ""),
                "publishedAt": a.get("time_published", ""),
                "summary": a.get("summary", ""),
                "overallSentimentScore": float(a.get("overall_sentiment_score", 0)),
                "overallSentimentLabel": a.get("overall_sentiment_label", "Neutral"),
                "tickerSentimentScore": float(ticker_sentiment["ticker_sentiment_score"]) if ticker_sentiment else None,
                "tickerSentimentLabel": ticker_sentiment["ticker_sentiment_label"] if ticker_sentiment else None,
                "relevanceScore": float(ticker_sentiment["relevance_score"]) if ticker_sentiment else None,
            })
        # Aggregate sentiment
        scores = [r["overallSentimentScore"] for r in result]
        avg_score = sum(scores) / len(scores) if scores else 0
        return {
            "symbol": symbol.upper(),
            "articles": result,
            "aggregateSentiment": {
                "score": round(avg_score, 4),
                "label": _score_to_label(avg_score),
                "count": len(result),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _score_to_label(score: float) -> str:
    if score >= 0.35:
        return "Bullish"
    elif score >= 0.15:
        return "Somewhat-Bullish"
    elif score >= -0.15:
        return "Neutral"
    elif score >= -0.35:
        return "Somewhat-Bearish"
    else:
        return "Bearish"
