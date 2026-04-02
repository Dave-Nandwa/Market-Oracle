import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

const MACRO_LABELS: Record<string, string> = {
  vix: "VIX",
  spx: "SPX",
  comp: "COMP",
  fedRate: "FED",
  treasury10y: "10Y",
  gold: "GOLD",
  wti: "WTI",
}

export function MacroPills() {
  const { data, isLoading } = useQuery({
    queryKey: ["macro"],
    queryFn: api.getMacro,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-16" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const pills = [
    { key: "vix", value: data.vix?.value ?? null },
    { key: "spx", value: data.spx?.value ?? null },
    { key: "comp", value: data.comp?.value ?? null },
    { key: "fedRate", value: data.fedRate?.value ?? null },
    { key: "treasury10y", value: data.treasury10y?.value ?? null },
    { key: "gold", value: data.gold?.value ?? null, prefix: "$" },
    { key: "wti", value: data.wti?.value ?? null, prefix: "$" },
  ]

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {pills.map(({ key, value, prefix }) => (
        <div
          key={key}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#111113] border border-[#1f1f23] text-xs"
        >
          <span className="text-[#71717a] font-medium">{MACRO_LABELS[key]}</span>
          <span className="font-mono text-[#f4f4f5]">
            {value != null ? `${prefix ?? ""}${value.toFixed(2)}` : "—"}
          </span>
        </div>
      ))}
    </div>
  )
}
