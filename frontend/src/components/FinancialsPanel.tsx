import { useQuery } from "@tanstack/react-query"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { formatLargeNumber, formatPrice } from "@/lib/utils"
import type { FinancialStatement } from "@/lib/types"

interface FinancialsPanelProps {
  symbol: string
}

const tickStyle = { fill: "#71717a", fontSize: 9, fontFamily: "JetBrains Mono" }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: unknown; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-[#111113] border border-[#1f1f23] rounded p-2 text-xs space-y-1">
      <p className="text-[#71717a]">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-mono" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? formatLargeNumber(p.value) : "—"}
        </p>
      ))}
    </div>
  )
}

function IncomeTab({ data }: { data: FinancialStatement[] }) {
  const chartData = [...data].reverse().map((d) => ({
    date: d.date?.slice(0, 7) ?? "",
    revenue: d.revenue ?? null,
    netIncome: d.netIncome ?? null,
  }))

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
          <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} />
          <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => formatLargeNumber(v)} />
          <Tooltip content={(props) => <ChartTooltip {...props} />} />
          <Legend wrapperStyle={{ fontSize: 10, color: "#71717a" }} />
          <Bar dataKey="revenue" name="Revenue" fill="#6366f1" opacity={0.85} radius={[2, 2, 0, 0]} />
          <Bar dataKey="netIncome" name="Net Income" fill="#22c55e" opacity={0.85} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1f1f23]">
              <th className="text-left py-1 text-[#71717a] font-normal">Date</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">Revenue</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">Gross Profit</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">Op. Income</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">Net Income</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">EPS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-b border-[#1f1f23] hover:bg-[#1f1f23]/30">
                <td className="py-1 text-[#71717a]">{d.date}</td>
                <td className="py-1 text-right font-mono text-[#f4f4f5]">{formatLargeNumber(d.revenue)}</td>
                <td className="py-1 text-right font-mono text-[#f4f4f5]">{formatLargeNumber(d.grossProfit)}</td>
                <td className="py-1 text-right font-mono text-[#f4f4f5]">{formatLargeNumber(d.operatingIncome)}</td>
                <td className="py-1 text-right font-mono" style={{ color: (d.netIncome ?? 0) >= 0 ? "#22c55e" : "#ef4444" }}>{formatLargeNumber(d.netIncome)}</td>
                <td className="py-1 text-right font-mono text-[#f4f4f5]">{d.eps != null ? `$${formatPrice(d.eps)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BalanceTab({ data }: { data: FinancialStatement[] }) {
  const chartData = [...data].reverse().map((d) => ({
    date: d.date?.slice(0, 7) ?? "",
    totalAssets: d.totalAssets ?? null,
    totalLiabilities: d.totalLiabilities ?? null,
    totalEquity: d.totalEquity ?? null,
  }))

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
          <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} />
          <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => formatLargeNumber(v)} />
          <Tooltip content={(props) => <ChartTooltip {...props} />} />
          <Legend wrapperStyle={{ fontSize: 10, color: "#71717a" }} />
          <Bar dataKey="totalAssets" name="Assets" fill="#6366f1" opacity={0.85} radius={[2, 2, 0, 0]} />
          <Bar dataKey="totalLiabilities" name="Liabilities" fill="#ef4444" opacity={0.75} radius={[2, 2, 0, 0]} />
          <Bar dataKey="totalEquity" name="Equity" fill="#22c55e" opacity={0.85} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1f1f23]">
              <th className="text-left py-1 text-[#71717a] font-normal">Date</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">Assets</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">Liabilities</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">Equity</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">Cash</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">LT Debt</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-b border-[#1f1f23] hover:bg-[#1f1f23]/30">
                <td className="py-1 text-[#71717a]">{d.date}</td>
                <td className="py-1 text-right font-mono text-[#f4f4f5]">{formatLargeNumber(d.totalAssets)}</td>
                <td className="py-1 text-right font-mono text-[#ef4444]">{formatLargeNumber(d.totalLiabilities)}</td>
                <td className="py-1 text-right font-mono text-[#22c55e]">{formatLargeNumber(d.totalEquity)}</td>
                <td className="py-1 text-right font-mono text-[#f4f4f5]">{formatLargeNumber(d.cash)}</td>
                <td className="py-1 text-right font-mono text-[#f4f4f5]">{formatLargeNumber(d.longTermDebt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CashFlowTab({ data }: { data: FinancialStatement[] }) {
  const chartData = [...data].reverse().map((d) => ({
    date: d.date?.slice(0, 7) ?? "",
    operatingCashflow: d.operatingCashflow ?? null,
    capex: d.capex ?? null,
    freeCashflow: d.freeCashflow ?? null,
  }))

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
          <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} />
          <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => formatLargeNumber(v)} />
          <Tooltip content={(props) => <ChartTooltip {...props} />} />
          <Legend wrapperStyle={{ fontSize: 10, color: "#71717a" }} />
          <ReferenceLine y={0} stroke="#1f1f23" />
          <Bar dataKey="operatingCashflow" name="Op. CF" fill="#6366f1" opacity={0.85} radius={[2, 2, 0, 0]} />
          <Bar dataKey="capex" name="CapEx" fill="#ef4444" opacity={0.75} radius={[2, 2, 0, 0]} />
          <Bar dataKey="freeCashflow" name="Free CF" fill="#22c55e" opacity={0.85} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1f1f23]">
              <th className="text-left py-1 text-[#71717a] font-normal">Date</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">Op. CF</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">CapEx</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">Free CF</th>
              <th className="text-right py-1 text-[#71717a] font-normal font-mono">Dividends</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-b border-[#1f1f23] hover:bg-[#1f1f23]/30">
                <td className="py-1 text-[#71717a]">{d.date}</td>
                <td className="py-1 text-right font-mono text-[#6366f1]">{formatLargeNumber(d.operatingCashflow)}</td>
                <td className="py-1 text-right font-mono text-[#ef4444]">{formatLargeNumber(d.capex)}</td>
                <td className="py-1 text-right font-mono" style={{ color: (d.freeCashflow ?? 0) >= 0 ? "#22c55e" : "#ef4444" }}>{formatLargeNumber(d.freeCashflow)}</td>
                <td className="py-1 text-right font-mono text-[#f4f4f5]">{formatLargeNumber(d.dividendPayout)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function FinancialsPanel({ symbol }: FinancialsPanelProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["financials", symbol],
    queryFn: () => api.getFinancials(symbol),
    staleTime: 60 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <Card className="bg-[#111113] border-[#1f1f23] h-full">
        <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
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
              <span>Failed to load financials.</span>
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
          Financials — {symbol}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Tabs defaultValue="income">
          <TabsList className="bg-[#0a0a0b] border border-[#1f1f23] mb-3 h-8">
            <TabsTrigger value="income" className="text-xs data-[state=active]:bg-[#1f1f23] data-[state=active]:text-[#f4f4f5] text-[#71717a]">Income</TabsTrigger>
            <TabsTrigger value="balance" className="text-xs data-[state=active]:bg-[#1f1f23] data-[state=active]:text-[#f4f4f5] text-[#71717a]">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cashflow" className="text-xs data-[state=active]:bg-[#1f1f23] data-[state=active]:text-[#f4f4f5] text-[#71717a]">Cash Flow</TabsTrigger>
          </TabsList>
          <TabsContent value="income">
            {data.income.length > 0 ? <IncomeTab data={data.income} /> : <p className="text-xs text-[#71717a]">No income data available.</p>}
          </TabsContent>
          <TabsContent value="balance">
            {data.balance.length > 0 ? <BalanceTab data={data.balance} /> : <p className="text-xs text-[#71717a]">No balance sheet data available.</p>}
          </TabsContent>
          <TabsContent value="cashflow">
            {data.cashflow.length > 0 ? <CashFlowTab data={data.cashflow} /> : <p className="text-xs text-[#71717a]">No cash flow data available.</p>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
