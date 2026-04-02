import { useQuery } from "@tanstack/react-query"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"
import type { TechnicalDataPoint } from "@/lib/types"

interface TechnicalsPanelProps {
  symbol: string
}

export function TechnicalsPanel({ symbol }: TechnicalsPanelProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["technicals", symbol],
    queryFn: () => api.getTechnicals(symbol),
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <Card className="bg-[#111113] border-[#1f1f23] h-full">
        <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
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
              <span>Failed to load technicals.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const rsiData = data.rsi.slice(-60).map((d: TechnicalDataPoint) => ({
    date: d.date,
    rsi: typeof d.RSI === "number" ? d.RSI : (typeof d.rsi === "number" ? d.rsi : null),
  }))

  const macdData = data.macd.slice(-60).map((d: TechnicalDataPoint) => {
    const macdVal = typeof d.MACD === "number" ? d.MACD : (typeof d.macd === "number" ? d.macd : null)
    const signalVal = typeof d.MACD_Signal === "number" ? d.MACD_Signal : (typeof d.signal === "number" ? d.signal : null)
    const histVal = typeof d.MACD_Hist === "number" ? d.MACD_Hist : (typeof d.hist === "number" ? d.hist : null)
    return { date: d.date, macd: macdVal, signal: signalVal, hist: histVal }
  })

  const adxSeries = (data.adx ?? []).slice(-100)
  const obvSeries = (data.obv ?? []).slice(-100)
  const stochSeries = (data.stoch ?? []).slice(-60)
  const mfiSeries = (data.mfi ?? []).slice(-60)

  const latestRSI = rsiData[rsiData.length - 1]?.rsi
  const latestMACD = macdData[macdData.length - 1]?.macd
  const latestSignal = macdData[macdData.length - 1]?.signal
  const latestADX = adxSeries.length > 0 ? (() => { const v = adxSeries[adxSeries.length - 1]; return typeof v?.ADX === "number" ? v.ADX : null })() : null
  const latestMFI = mfiSeries.length > 0 ? (() => { const v = mfiSeries[mfiSeries.length - 1]; return typeof v?.MFI === "number" ? v.MFI : null })() : null

  const adxChartData = adxSeries.map((d) => ({ date: d.date, adx: typeof d.ADX === "number" ? d.ADX : null }))
  const obvChartData = obvSeries.map((d) => ({ date: d.date, obv: typeof d.OBV === "number" ? d.OBV : null }))
  const stochChartData = stochSeries.map((d) => ({
    date: d.date,
    slowK: typeof d.SlowK === "number" ? d.SlowK : null,
    slowD: typeof d.SlowD === "number" ? d.SlowD : null,
  }))

  const rsiColor = latestRSI != null
    ? latestRSI > 70 ? "#ef4444" : latestRSI < 30 ? "#22c55e" : "#6366f1"
    : "#6366f1"

  return (
    <Card className="bg-[#111113] border-[#1f1f23] h-full">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-[#f4f4f5]">
          Technicals — {symbol}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Current values */}
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-xs text-[#71717a]">RSI</span>
            <p className="font-mono text-lg font-bold" style={{ color: rsiColor }}>
              {latestRSI != null ? latestRSI.toFixed(1) : "—"}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#71717a]">MACD</span>
            <p className={`font-mono text-lg font-bold ${latestMACD != null && latestMACD >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
              {latestMACD != null ? latestMACD.toFixed(3) : "—"}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#71717a]">Signal</span>
            <p className="font-mono text-lg font-bold text-[#f59e0b]">
              {latestSignal != null ? latestSignal.toFixed(3) : "—"}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#71717a]">ADX</span>
            <p className={`font-mono text-lg font-bold ${latestADX != null && latestADX > 25 ? "text-[#6366f1]" : "text-[#71717a]"}`}>
              {latestADX != null ? latestADX.toFixed(1) : "—"}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#71717a]">MFI</span>
            <p className={`font-mono text-lg font-bold ${latestMFI != null ? (latestMFI > 80 ? "text-[#ef4444]" : latestMFI < 20 ? "text-[#22c55e]" : "text-[#f4f4f5]") : "text-[#71717a]"}`}>
              {latestMFI != null ? latestMFI.toFixed(1) : "—"}
            </p>
          </div>
        </div>

        <Separator className="bg-[#1f1f23]" />

        {/* RSI chart */}
        <div>
          <p className="text-xs text-[#71717a] mb-1">RSI (14)</p>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={rsiData} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#71717a", fontSize: 9, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload && payload.length > 0 ? (
                    <div className="bg-[#111113] border border-[#1f1f23] rounded p-2 text-xs">
                      <p className="text-[#71717a]">{label}</p>
                      <p className="font-mono text-[#6366f1]">RSI: {typeof payload[0]?.value === "number" ? payload[0].value.toFixed(2) : "—"}</p>
                    </div>
                  ) : null
                }
              />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
              <Line type="monotone" dataKey="rsi" stroke="#6366f1" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* MACD histogram */}
        <div>
          <p className="text-xs text-[#71717a] mb-1">MACD Histogram</p>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={macdData} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 9, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={false}
                width={36}
                tickFormatter={(v) => typeof v === "number" ? v.toFixed(2) : String(v)}
              />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload && payload.length > 0 ? (
                    <div className="bg-[#111113] border border-[#1f1f23] rounded p-2 text-xs">
                      <p className="text-[#71717a]">{label}</p>
                      <p className="font-mono text-[#f4f4f5]">Hist: {typeof payload[0]?.value === "number" ? payload[0].value.toFixed(4) : "—"}</p>
                    </div>
                  ) : null
                }
              />
              <ReferenceLine y={0} stroke="#1f1f23" />
              <Bar dataKey="hist" radius={[1, 1, 0, 0]}>
                {macdData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.hist != null && entry.hist >= 0 ? "#22c55e" : "#ef4444"}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* OBV — Volume Flow */}
        {obvChartData.length > 0 && (
          <div>
            <p className="text-xs text-[#71717a] mb-1">OBV — Volume Flow</p>
            <ResponsiveContainer width="100%" height={70}>
              <LineChart data={obvChartData} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 9, fontFamily: "JetBrains Mono" }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tickFormatter={(v) => {
                    const n = typeof v === "number" ? v : Number(v)
                    if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`
                    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`
                    if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)}K`
                    return String(n)
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload && payload.length > 0 ? (
                      <div className="bg-[#111113] border border-[#1f1f23] rounded p-2 text-xs">
                        <p className="text-[#71717a]">{label}</p>
                        <p className="font-mono text-[#f59e0b]">OBV: {typeof payload[0]?.value === "number" ? payload[0].value.toLocaleString() : "—"}</p>
                      </div>
                    ) : null
                  }
                />
                <Line type="monotone" dataKey="obv" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* STOCH %K/%D */}
        {stochChartData.length > 0 && (
          <div>
            <p className="text-xs text-[#71717a] mb-1">Stochastic %K / %D</p>
            <ResponsiveContainer width="100%" height={70}>
              <LineChart data={stochChartData} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#71717a", fontSize: 9, fontFamily: "JetBrains Mono" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload && payload.length > 0 ? (
                      <div className="bg-[#111113] border border-[#1f1f23] rounded p-2 text-xs">
                        <p className="text-[#71717a]">{label}</p>
                        {payload.map((p) => (
                          <p key={p.name as string} className="font-mono" style={{ color: p.color }}>
                            {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : "—"}
                          </p>
                        ))}
                      </div>
                    ) : null
                  }
                />
                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
                <Line type="monotone" dataKey="slowK" name="%K" stroke="#6366f1" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="slowD" name="%D" stroke="#f59e0b" strokeWidth={1.2} dot={false} strokeDasharray="3 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ADX */}
        {adxChartData.length > 0 && (
          <div>
            <p className="text-xs text-[#71717a] mb-1">ADX (14) — Trend Strength</p>
            <ResponsiveContainer width="100%" height={70}>
              <LineChart data={adxChartData} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#71717a", fontSize: 9, fontFamily: "JetBrains Mono" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload && payload.length > 0 ? (
                      <div className="bg-[#111113] border border-[#1f1f23] rounded p-2 text-xs">
                        <p className="text-[#71717a]">{label}</p>
                        <p className="font-mono text-[#6366f1]">ADX: {typeof payload[0]?.value === "number" ? payload[0].value.toFixed(2) : "—"}</p>
                      </div>
                    ) : null
                  }
                />
                <ReferenceLine y={25} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} />
                <Line type="monotone" dataKey="adx" stroke="#6366f1" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
