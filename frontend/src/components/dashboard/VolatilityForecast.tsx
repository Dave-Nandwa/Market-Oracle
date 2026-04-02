'use client';
import { useMemo } from 'react';
import type { VolatilityData } from '@/lib/types';
import { REGIME_COLORS } from '@/lib/types';

interface Props {
  data: VolatilityData | null;
  symbol: string;
}

export default function VolatilityForecast({ data, symbol }: Props) {
  if (!data) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-[#64748B] text-sm animate-pulse">Computing realized volatility…</div>
      </div>
    );
  }

  const { rv20, dates, lastRV, regime, autocorrelation, forecast } = data;
  const regimeColor = REGIME_COLORS[regime];

  // Last 60 points for display
  const DISPLAY_N = 60;
  const displayDates = dates.slice(-DISPLAY_N);
  const displayRV = rv20.slice(-DISPLAY_N);

  // Forecast dates
  const lastDate = new Date(displayDates[displayDates.length - 1]);
  const forecastDates = Array.from({ length: forecast.horizon }, (_, i) => {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i + 1);
    // Skip weekends
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  const allDates = [...displayDates, ...forecastDates];
  const allRV = [...displayRV, ...forecast.q50];

  // SVG chart dimensions
  const W = 600, H = 220, PAD = { top: 16, right: 16, bottom: 28, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxV = Math.max(...displayRV, ...forecast.q90) * 1.1;
  const minV = 0;

  const xScale = (i: number) => PAD.left + (i / (allDates.length - 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - ((v - minV) / (maxV - minV)) * chartH;

  // Path builders
  const path = (vals: number[], offset: number) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(offset + i).toFixed(1)} ${yScale(v).toFixed(1)}`).join(' ');

  const forecastOffset = displayDates.length;

  // Cone area (q10 → q90)
  const conePoints = [
    ...forecast.q90.map((v, i) => `${xScale(forecastOffset + i).toFixed(1)},${yScale(v).toFixed(1)}`),
    ...[...forecast.q10].reverse().map((v, i) => `${xScale(forecastOffset + forecast.horizon - 1 - i).toFixed(1)},${yScale(v).toFixed(1)}`),
  ].join(' ');

  // Y-axis ticks
  const yTicks = [0, 0.1, 0.2, 0.35, 0.5].filter(t => t <= maxV * 1.05);

  // Divider x position
  const dividerX = xScale(forecastOffset - 0.5);

  return (
    <div>
      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <div>
          <span className="text-xs text-[#64748B]">CURRENT RV (20d)</span>
          <span className="ml-2 font-mono text-lg font-bold" style={{ color: regimeColor }}>
            {(lastRV * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs px-1.5 py-0.5 rounded border font-mono font-bold uppercase" style={{ color: regimeColor, borderColor: regimeColor }}>
            {regime}
          </span>
        </div>
        <div>
          <span className="text-xs text-[#64748B]">AUTOCORR</span>
          <span className="ml-1.5 font-mono text-sm" style={{ color: autocorrelation > 0.3 ? '#7C3AED' : '#64748B' }}>
            {autocorrelation.toFixed(3)}
            {autocorrelation > 0.3 && <span className="ml-1 text-[10px] text-[#7C3AED]">CLUSTERING</span>}
          </span>
        </div>
        {forecast.source === 'mock' && (
          <span className="text-[10px] text-[#64748B] border border-[#2A2A3E] px-1.5 py-0.5 rounded">
            MOCK FORECAST — Add Modal tokens for TimesFM
          </span>
        )}
      </div>

      {/* SVG Chart */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300 }}>
          {/* Y-axis grid + labels */}
          {yTicks.map(tick => (
            <g key={tick}>
              <line
                x1={PAD.left} y1={yScale(tick)}
                x2={PAD.left + chartW} y2={yScale(tick)}
                stroke="#2A2A3E" strokeWidth="0.5"
              />
              <text x={PAD.left - 4} y={yScale(tick) + 4} textAnchor="end" fontSize="9" fill="#475569">
                {(tick * 100).toFixed(0)}%
              </text>
            </g>
          ))}

          {/* Forecast divider */}
          <line x1={dividerX} y1={PAD.top} x2={dividerX} y2={PAD.top + chartH}
            stroke="#2A2A3E" strokeWidth="1" strokeDasharray="3,3" />
          <text x={dividerX + 4} y={PAD.top + 10} fontSize="8" fill="#475569">Forecast</text>

          {/* Cone shading */}
          <polygon points={conePoints} fill="rgba(124,58,237,0.12)" />

          {/* q10 and q90 bounds */}
          <path d={path(forecast.q90, forecastOffset)} stroke="rgba(124,58,237,0.3)" strokeWidth="1" fill="none" strokeDasharray="3,3" />
          <path d={path(forecast.q10, forecastOffset)} stroke="rgba(124,58,237,0.3)" strokeWidth="1" fill="none" strokeDasharray="3,3" />

          {/* Historical RV line */}
          <path d={path(displayRV, 0)} stroke="#A78BFA" strokeWidth="2" fill="none" />

          {/* Forecast median line */}
          <path d={`M ${xScale(forecastOffset - 1).toFixed(1)} ${yScale(displayRV[displayRV.length - 1]).toFixed(1)} ${path(forecast.q50, forecastOffset).slice(1)}`}
            stroke="#7C3AED" strokeWidth="2" fill="none" strokeDasharray="5,4" />

          {/* Forecast dots */}
          {forecast.q50.map((v, i) => (
            <circle key={i} cx={xScale(forecastOffset + i)} cy={yScale(v)} r="3" fill="#7C3AED" />
          ))}

          {/* X-axis labels */}
          {[0, Math.floor(displayDates.length / 2), displayDates.length - 1].map(i => (
            <text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#475569">
              {displayDates[i]?.slice(5)}
            </text>
          ))}

          {/* Regime threshold lines */}
          {[0.10, 0.20, 0.35].map(thresh => (
            <line key={thresh}
              x1={PAD.left} y1={yScale(thresh)}
              x2={PAD.left + chartW} y2={yScale(thresh)}
              stroke="rgba(100,116,139,0.4)" strokeWidth="0.5" strokeDasharray="2,4"
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-[#64748B]">
        <LegendItem color="#A78BFA" label="Realized Vol (20d)" />
        <LegendItem color="#7C3AED" label="Forecast median" dashed />
        <LegendItem color="rgba(124,58,237,0.3)" label="80% confidence cone" area />
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed, area }: { color: string; label: string; dashed?: boolean; area?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <svg width="20" height="8">
        {area ? (
          <rect x="0" y="2" width="20" height="4" fill={color} />
        ) : (
          <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '4,3' : undefined} />
        )}
      </svg>
      <span>{label}</span>
    </div>
  );
}
