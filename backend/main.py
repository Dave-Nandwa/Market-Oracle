from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ticker, intelligence, macro, search, market

app = FastAPI(
    title="Market Oracle API",
    description="Quant-grade financial analytics powered by TimesFM + AlphaVantage",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://market-oracle.netlify.app",
        "*",  # temporary — can restrict later
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ticker.router)
app.include_router(intelligence.router)
app.include_router(macro.router)
app.include_router(search.router)
app.include_router(market.router)


@app.get("/")
async def health():
    return {"status": "ok", "service": "Market Oracle API", "version": "0.1.0"}


@app.get("/api/health")
async def api_health():
    return {"status": "ok"}
