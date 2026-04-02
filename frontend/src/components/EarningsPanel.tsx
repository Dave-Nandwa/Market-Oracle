import { useQuery } from "@tanstack/react-query"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { formatPrice } from "@/lib/utils"

interface EarningsPanelProps {
  symbol: string
}

export function EarningsPanel({ symbol }: EarningsPanelProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["earnings", symbol],
    queryFn: () => api.getEarnings(symbol),
    staleTime: 60 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <Card className="bg-[#111113] border-[#1f1f23] h-full">
        <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-16" />)}
          </div>
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
              <span>Failed to load earnings.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const chartData = [...data.quarters].reverse().map((q) => ({
    date: q.date?.slice(0, 7) ?? "",
    reported: q.reported,
    estimated: q.estimated,
    beat: q.reported != null && q.estimated != null ? q.reported >= q.estimated : null,
    surprisePct: q.surprisePct,
  }))

  return (
    <Card className="bg-[#111113] border-[#1f1f23] h-full">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-[#f4f4f5]">
          Earnings — {symbol}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <ResponsiveContainer width="100%" height={150}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#71717a", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} width={36} tickFormatter={(v) => typeof v === "number" ? `$${formatPrice(v)}` : String(v)} />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload && payload.length > 0 ? (
                  <div className="bg-[#111113] border border-[#1f1f23] rounded p-2 text-xs space-y-1">
                    <p className="text-[#71717a]">{label}</p>
                    {payload.map((p) => (
                      <p key={p.name as string} className="font-mono" style={{ color: p.color }}>
                        {p.name}: {typeof p.value === "number" ? `$${formatPrice(p.value)}` : "—"}
                      </p>
                    ))}
                  </div>
                ) : null
              }
            />
            <Legend wrapperStyle={{ fontSize: 10, color: "#71717a" }} />
            <Bar dataKey="reported" name="Reported EPS" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.beat === true ? "#22c55e" : entry.beat === false ? "#ef4444" : "#6366f1"} fillOpacity={0.85} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="estimated" name="Est. EPS" stroke="#71717a" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Surprise badges */}
        <div className="flex flex-wrap gap-1.5">
          {[...data.quarters].reverse().map((q) => {
            const beat = q.reported != null && q.estimated != null ? q.reported >= q.estimated : null
            const pct = q.surprisePct
            return (
              <Badge
                key={q.date}
                className={`font-mono text-xs px-2 py-0.5 ${
                  beat === true
                    ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30"
                    : beat === false
                    ? "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30"
                    : "bg-[#1f1f23] text-[#71717a] border-[#1f1f23]"
                } border`}
              >
                {q.date?.slice(0, 7)} {pct != null ? `${pct >= 0 ? "+" : ""}${typeof pct === "number" ? pct.toFixed(1) : pct}%` : ""}
              </Badge>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
