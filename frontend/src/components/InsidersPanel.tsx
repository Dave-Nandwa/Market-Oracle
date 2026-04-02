import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"
import { formatLargeNumber, formatPrice } from "@/lib/utils"

interface InsidersPanelProps {
  symbol: string
}

export function InsidersPanel({ symbol }: InsidersPanelProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["insiders", symbol],
    queryFn: () => api.getInsiders(symbol),
    staleTime: 60 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <Card className="bg-[#111113] border-[#1f1f23] h-full">
        <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card className="bg-[#111113] border-[#1f1f23] h-full">
        <CardContent className="flex items-center justify-center h-48">
          <Alert variant="destructive" className="border-[#ef4444]/30 bg-[#ef4444]/10 max-w-sm">
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>Failed to load insider transactions.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#111113] border-[#1f1f23] h-full">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-[#f4f4f5]">
          Insiders — {symbol}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {data.transactions.length === 0 ? (
          <p className="text-xs text-[#71717a]">No recent insider transactions.</p>
        ) : (
          <ScrollArea className="max-h-[280px]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1f1f23]">
                  <th className="text-left py-1 text-[#71717a] font-normal">Date</th>
                  <th className="text-left py-1 text-[#71717a] font-normal">Executive</th>
                  <th className="text-center py-1 text-[#71717a] font-normal">Type</th>
                  <th className="text-right py-1 text-[#71717a] font-normal font-mono">Shares</th>
                  <th className="text-right py-1 text-[#71717a] font-normal font-mono">Price</th>
                  <th className="text-right py-1 text-[#71717a] font-normal font-mono">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.slice(0, 10).map((t, i) => (
                  <tr key={i} className="border-b border-[#1f1f23] hover:bg-[#1f1f23]/30">
                    <td className="py-1.5 text-[#71717a]">{t.date}</td>
                    <td className="py-1.5 text-[#f4f4f5] max-w-[120px] truncate" title={t.executive}>{t.executive}</td>
                    <td className="py-1.5 text-center">
                      <Badge
                        className={`text-xs px-1.5 py-0 border ${
                          t.type === "Buy"
                            ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30"
                            : "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30"
                        }`}
                      >
                        {t.type}
                      </Badge>
                    </td>
                    <td className="py-1.5 text-right font-mono text-[#f4f4f5]">{t.shares.toLocaleString()}</td>
                    <td className="py-1.5 text-right font-mono text-[#f4f4f5]">{t.price != null ? `$${formatPrice(t.price)}` : "—"}</td>
                    <td className="py-1.5 text-right font-mono text-[#f4f4f5]">{formatLargeNumber(t.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
