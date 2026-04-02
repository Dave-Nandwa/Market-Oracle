'use client';
import type { OHLCVBar } from '@/lib/types';

interface Props {
  bars: OHLCVBar[];
  symbol: string;
}

export default function MainChart({ bars, symbol }: Props) {
  if (!bars.length) {
    return <div className="h-56 flex items-center justify-center text-[#64748B] text-sm animate-pulse">Loading chart…</div>;
  }

  const display = bars.slice(-90); // last 90 trading days
  const W = 600, H = 200, PAD = { top: 8, right: 8, bottom: 24, left: 56 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const prices = display.map(b => b.close);
  const minP = Math.min(...prices) * 0.998;
  const maxP = Math.max(...prices) * 1.002;

  const xScale = (i: number) => PAD.left + (i / (display.length - 1)) * chartW;
  const yScale = (p: number) => PAD.top + chartH - ((p - minP) / (maxP - minP)) * chartH;

  const linePath = prices.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(p).toFixed(1)}`).join(' ');

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isUp = lastPrice >= firstPrice;
  const lineColor = isUp ? '#10B981' : '#EF4444';
  const fillColor = isUp ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)';

  // Fill area under line
  const fillPath = `${linePath} L ${xScale(display.length - 1).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${PAD.left} ${(PAD.top + chartH).toFixed(1)} Z`;

  // Y-axis ticks (4 ticks)
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount }, (_, i) => minP + ((maxP - minP) * i) / (yTickCount - 1));

  // X-axis: show 3 date labels
  const xLabels = [0, Math.floor(display.length / 2), display.length - 1];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
        {/* Grid */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yScale(tick)} x2={PAD.left + chartW} y2={yScale(tick)}
              stroke="#2A2A3E" strokeWidth="0.5" />
            <text x={PAD.left - 4} y={yScale(tick) + 4} textAnchor="end" fontSize="9" fill="#475569">
              ${tick.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Fill */}
        <path d={fillPath} fill={fillColor} />

        {/* Line */}
        <path d={linePath} stroke={lineColor} strokeWidth="1.5" fill="none" />

        {/* Last price dot */}
        <circle cx={xScale(display.length - 1)} cy={yScale(lastPrice)} r="3" fill={lineColor} />

        {/* X labels */}
        {xLabels.map(i => (
          <text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#475569">
            {display[i]?.date?.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}
