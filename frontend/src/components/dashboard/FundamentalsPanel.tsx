'use client';
import type { TickerOverview } from '@/lib/types';

interface Props { overview: TickerOverview | null; }

export default function FundamentalsPanel({ overview }: Props) {
  if (!overview) return <div className="animate-pulse text-[#64748B] text-sm p-4">Loading fundamentals…</div>;

  const fmt = (v: string | undefined) => (!v || v === 'None' || v === '-') ? '—' : v;
  const fmtPct = (v: string | undefined) => (!v || v === 'None') ? '—' : `${(parseFloat(v) * 100).toFixed(1)}%`;

  const buyCount = parseInt(overview.analystRatingBuy || '0');
  const holdCount = parseInt(overview.analystRatingHold || '0');
  const sellCount = parseInt(overview.analystRatingSell || '0');
  const totalAnalysts = buyCount + holdCount + sellCount;

  return (
    <div>
      <h3 className="text-xs text-[#64748B] uppercase tracking-wider mb-3">Fundamentals</h3>
      <div className="grid grid-cols-2 gap-3">
        {/* Valuation */}
        <div>
          <p className="text-[10px] text-[#475569] uppercase mb-1.5">Valuation</p>
          <table className="data-table">
            <tbody>
              <StatRow label="P/E" value={fmt(overview.pe)} />
              <StatRow label="Fwd P/E" value={fmt(overview.forwardPE)} />
              <StatRow label="EV/EBITDA" value={fmt(overview.evToEbitda)} />
              <StatRow label="P/B" value={fmt(overview.priceToBook)} />
              <StatRow label="Beta" value={fmt(overview.beta)} />
            </tbody>
          </table>
        </div>

        {/* Growth */}
        <div>
          <p className="text-[10px] text-[#475569] uppercase mb-1.5">Growth & Profitability</p>
          <table className="data-table">
            <tbody>
              <StatRow label="Rev Growth" value={fmtPct(overview.revenueGrowthYOY)} />
              <StatRow label="EPS Growth" value={fmtPct(overview.earningsGrowthYOY)} />
              <StatRow label="Net Margin" value={fmtPct(overview.profitMargin)} />
              <StatRow label="EPS (TTM)" value={fmt(overview.eps)} />
              <StatRow label="Div Yield" value={fmtPct(overview.dividendYield)} />
            </tbody>
          </table>
        </div>

        {/* Analyst */}
        <div>
          <p className="text-[10px] text-[#475569] uppercase mb-1.5">Analyst Ratings</p>
          <div className="text-xs mb-1">
            <span className="text-[#64748B]">Target: </span>
            <span className="font-mono text-[#E2E8F0]">${fmt(overview.analystTargetPrice)}</span>
          </div>
          {totalAnalysts > 0 && (
            <div className="flex gap-0.5 h-2 rounded overflow-hidden mb-1">
              <div className="bg-[#10B981]" style={{ width: `${(buyCount / totalAnalysts) * 100}%` }} />
              <div className="bg-[#F59E0B]" style={{ width: `${(holdCount / totalAnalysts) * 100}%` }} />
              <div className="bg-[#EF4444]" style={{ width: `${(sellCount / totalAnalysts) * 100}%` }} />
            </div>
          )}
          <div className="flex gap-3 text-[10px]">
            <span className="text-[#10B981]">Buy {buyCount}</span>
            <span className="text-[#F59E0B]">Hold {holdCount}</span>
            <span className="text-[#EF4444]">Sell {sellCount}</span>
          </div>
        </div>

        {/* Moving averages */}
        <div>
          <p className="text-[10px] text-[#475569] uppercase mb-1.5">Moving Averages</p>
          <table className="data-table">
            <tbody>
              <StatRow label="MA50" value={fmt(overview.ma50) !== '—' ? `$${fmt(overview.ma50)}` : '—'} />
              <StatRow label="MA200" value={fmt(overview.ma200) !== '—' ? `$${fmt(overview.ma200)}` : '—'} />
              <StatRow label="52W High" value={fmt(overview.high52week) !== '—' ? `$${fmt(overview.high52week)}` : '—'} />
              <StatRow label="52W Low" value={fmt(overview.low52week) !== '—' ? `$${fmt(overview.low52week)}` : '—'} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="text-[#64748B]">{label}</td>
      <td className="font-mono text-right text-[#E2E8F0]">{value}</td>
    </tr>
  );
}
