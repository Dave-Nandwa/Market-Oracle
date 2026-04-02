import { useQuery } from "@tanstack/react-query"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import type { VolatilityRegime } from "@/lib/types"
import { cn } from "@/lib/utils"

interface VolatilityPanelProps {
  symbol: string
}

const REGIME_CONFIG: Record<VolatilityRegime, { color: string; glow: string; label: string }> = {
  LOW: { color: "text-[#22c55e] border-[#22c55e]", glow: "glow-gain", label: "LOW" },
  MEDIUM: { color: "text-[#f59e0b] border-[#f59e0b]", glow: "glow-warning", label: "MED" },
  HIGH: { color: "text-[#f97316] border-[#f97316]", glow: "glow-high", label: "HIGH" },
  EXTREME: { color: "text-[#ef4444] border-[#ef4444]", glow: "glow-loss", label: "EXTREME" },
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}

function VolTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded-lg p-3 shadow-xl">
      <p className="text-xs text-[#71717a] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span style={{ color: p.color }}>●</span>
          <span className="text-[#71717a]">{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>
            {typeof p.value === "number" ? `${(p.value * 100).toFixed(2)}%` : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function VolatilityPanel({ symbol }: VolatilityPanelProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["volatility", symbol],
    queryFn: () => api.getVolatility(symbol),
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <Card className="bg-[#111113] border-[#1f1f23] h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card className="bg-[#111113] border-[#1f1f23] h-full">
        <CardContent className="flex items-center justify-center h-64">
          <Alert variant="destructive" className="border-[#ef4444]/30 bg-[#ef4444]/10 max-w-sm">
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>Failed to load volatility data.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const regime = data.regime as VolatilityRegime
  const regConfig = REGIME_CONFIG[regime] ?? REGIME_CONFIG.MEDIUM

  // Build RV history chart data
  const rvData = data.dates.map((date, i) => ({
    date,
    rv5: data.rv5[i],
    rv10: data.rv10[i],
    rv20: data.rv20[i],
  }))

  // Build forecast data
  const forecastData = data.forecast?.point?.map((v, i) => ({
    i: `+${i + 1}d`,
    point: v,
    q10: data.forecast.q10[i],
    q90: data.forecast.q90[i],
  })) ?? []

  return (
    <Card className="bg-[#111113] border-[#1f1f23] h-full">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-[#f4f4f5]">
          Volatility — {symbol}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Regime badge */}
        <div className="flex items-center gap-4">
          <Badge
            variant="outline"
            className={cn("text-sm font-mono font-bold px-3 py-1", regConfig.color, regConfig.glow)}
          >
            {regConfig.label}
          </Badge>
          <div className="text-xs text-[#71717a]">
            Regime: <span className="font-mono text-[#f4f4f5]">{regime}</span>
          </div>
        </div>

        {/* RV values */}
        <div className="flex gap-4">
          {[
            { label: "RV5", value: data.rv5[data.rv5.length - 1] },
            { label: "RV10", value: data.rv10[data.rv10.length - 1] },
            { label: "RV20", value: data.rv20[data.rv20.length - 1] },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-[#71717a]">{label}</span>
              <span className="font-mono text-sm font-semibold text-[#f4f4f5]">
                {value != null ? `${(value * 100).toFixed(2)}%` : "—"}
              </span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[#71717a]">Autocorr</span>
            <span className="font-mono text-sm font-semibold text-[#f4f4f5]">
              {data.autocorrelation != null ? data.autocorrelation.toFixed(3) : "—"}
            </span>
          </div>
        </div>

        {/* RV history chart */}
        <div>
          <p className="text-xs text-[#71717a] mb-1">Realized Volatility History</p>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart data={rvData} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 9, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={false}
                width={42}
                tickFormatter={(v) => typeof v === "number" ? `${(v * 100).toFixed(0)}%` : String(v)}
              />
              <Tooltip content={<VolTooltip />} />
              <Area type="monotone" dataKey="rv5" name="RV5" stroke="#6366f1" fill="rgba(99,102,241,0.1)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="rv10" name="RV10" stroke="#f59e0b" fill="none" strokeWidth={1} dot={false} strokeDasharray="3 3" />
              <Area type="monotone" dataKey="rv20" name="RV20" stroke="#ef4444" fill="none" strokeWidth={1} dot={false} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast */}
        {forecastData.length > 0 && (
          <div>
            <p className="text-xs text-[#71717a] mb-1">
              Volatility Forecast
              <span className="ml-2 text-[#6366f1]">({data.forecast?.source ?? "model"})</span>
            </p>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={forecastData} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="i" tick={{ fill: "#71717a", fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload && payload.length > 0 ? (
                      <div className="bg-[#111113] border border-[#1f1f23] rounded p-2 text-xs">
                        <p className="text-[#71717a]">{label}</p>
                        {payload.map((p) => (
                          <p key={p.name} className="font-mono" style={{ color: p.color as string }}>
                            {p.name}: {typeof p.value === "number" ? `${(p.value * 100).toFixed(2)}%` : p.value}
                          </p>
                        ))}
                      </div>
                    ) : null
                  }
                />
                <Area type="monotone" dataKey="q90" name="Q90" stroke="none" fill="rgba(99,102,241,0.15)" />
                <Area type="monotone" dataKey="q10" name="Q10" stroke="none" fill="#0a0a0b" />
                <Area type="monotone" dataKey="point" name="Forecast" stroke="#6366f1" fill="none" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} />
                <ReferenceLine y={data.lastRV} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
