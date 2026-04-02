import { SearchBar } from "./SearchBar"
import { Button } from "@/components/ui/button"
import { MarketMovers } from "./MarketMovers"

const QUICK_PICKS = ["SPY", "QQQ", "AAPL", "NVDA", "TSLA", "BTC", "ETH"]

interface HomePageProps {
  onSelectTicker: (symbol: string) => void
}

export function HomePage({ onSelectTicker }: HomePageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        {/* Hero logo */}
        <div className="text-center">
          <div className="font-mono text-4xl font-bold tracking-widest mb-3">
            <span className="text-[#f4f4f5]">MARKET </span>
            <span className="text-[#6366f1]">ORACLE</span>
          </div>
          <p className="text-[#71717a] text-base">
            Bloomberg-grade market intelligence. Real-time data, AI volatility forecasts.
          </p>
        </div>

        {/* Search */}
        <SearchBar
          onSelect={onSelectTicker}
          placeholder="Search ticker or company name..."
          className="w-full"
          autoFocus
        />

        {/* Quick picks */}
        <div className="flex flex-wrap gap-2 justify-center">
          {QUICK_PICKS.map((symbol) => (
            <Button
              key={symbol}
              variant="outline"
              size="sm"
              onClick={() => onSelectTicker(symbol)}
              className="font-mono text-xs border-[#1f1f23] bg-[#111113] text-[#f4f4f5] hover:bg-[#1f1f23] hover:border-[#6366f1] hover:text-[#6366f1] transition-colors"
            >
              {symbol}
            </Button>
          ))}
        </div>

        {/* Market Movers */}
        <div className="w-full">
          <MarketMovers />
        </div>
      </div>
    </div>
  )
}
