import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import type { MarketMover } from "@/lib/types"

function MoverRow({ mover, onClick }: { mover: MarketMover; onClick: () => void }) {
  const isPositive = mover.change.startsWith("+") || (!mover.change.startsWith("-") && parseFloat(mover.change) >= 0)
  return (
    <div
      className="flex items-center justify-between py-2 border-b border-[#1f1f23] cursor-pointer hover:bg-[#1f1f23]/40 transition-colors px-1 rounded"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-sm text-[#f4f4f5]">{mover.ticker}</span>
        <span className={`font-mono text-xs font-semibold ${isPositive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
          {mover.change}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-[#71717a] font-mono">
        <span>${mover.price}</span>
        <span className="text-[#71717a]">{mover.volume}</span>
      </div>
    </div>
  )
}

function MoversSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}

export function MarketMovers() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ["market-movers"],
    queryFn: api.getMarketMovers,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })

  return (
    <Card className="bg-[#111113] border-[#1f1f23] w-full">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-[#f4f4f5]">Market Movers</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <MoversSkeleton />
        ) : !data ? (
          <p className="text-xs text-[#71717a]">No data available.</p>
        ) : (
          <Tabs defaultValue="gainers">
            <TabsList className="bg-[#0a0a0b] border border-[#1f1f23] mb-3 h-8">
              <TabsTrigger value="gainers" className="text-xs data-[state=active]:bg-[#1f1f23] data-[state=active]:text-[#22c55e] text-[#71717a]">
                Top Gainers
              </TabsTrigger>
              <TabsTrigger value="losers" className="text-xs data-[state=active]:bg-[#1f1f23] data-[state=active]:text-[#ef4444] text-[#71717a]">
                Top Losers
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs data-[state=active]:bg-[#1f1f23] data-[state=active]:text-[#f4f4f5] text-[#71717a]">
                Most Active
              </TabsTrigger>
            </TabsList>
            <TabsContent value="gainers">
              {data.gainers.length === 0 ? (
                <p className="text-xs text-[#71717a]">No data.</p>
              ) : (
                data.gainers.map((m) => (
                  <MoverRow key={m.ticker} mover={m} onClick={() => navigate(`/ticker/${m.ticker}`)} />
                ))
              )}
            </TabsContent>
            <TabsContent value="losers">
              {data.losers.length === 0 ? (
                <p className="text-xs text-[#71717a]">No data.</p>
              ) : (
                data.losers.map((m) => (
                  <MoverRow key={m.ticker} mover={m} onClick={() => navigate(`/ticker/${m.ticker}`)} />
                ))
              )}
            </TabsContent>
            <TabsContent value="active">
              {data.mostActive.length === 0 ? (
                <p className="text-xs text-[#71717a]">No data.</p>
              ) : (
                data.mostActive.map((m) => (
                  <MoverRow key={m.ticker} mover={m} onClick={() => navigate(`/ticker/${m.ticker}`)} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
