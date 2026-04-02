import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function toNum(value: unknown): number | null {
  if (value == null) return null
  const n = typeof value === "number" ? value : Number(value)
  return isNaN(n) ? null : n
}

export function formatPrice(value: unknown, decimals = 2): string {
  const n = toNum(value)
  if (n == null) return "—"
  return n.toFixed(decimals)
}

export function formatPct(value: unknown, decimals = 2): string {
  const n = toNum(value)
  if (n == null) return "—"
  return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`
}

export function formatPctAbs(value: unknown, decimals = 2): string {
  const n = toNum(value)
  if (n == null) return "—"
  return `${n.toFixed(decimals)}%`
}

export function formatLargeNumber(value: unknown): string {
  const n = toNum(value)
  if (n == null) return "—"
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toFixed(2)
}

export function formatVolume(value: unknown): string {
  return formatLargeNumber(value)
}

export function formatNullable(value: unknown, suffix = "", decimals = 2): string {
  const n = toNum(value)
  if (n == null) return "—"
  return `${n.toFixed(decimals)}${suffix}`
}
