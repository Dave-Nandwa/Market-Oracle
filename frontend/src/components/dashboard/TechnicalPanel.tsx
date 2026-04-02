'use client';
import { useState } from 'react';
import type { TechnicalIndicators } from '@/lib/types';

interface Props {
  data: TechnicalIndicators | null;
  symbol: string;
}

type Tab = 'RSI' | 'MACD' | 'BBANDS';

export default function TechnicalPanel({ data, symbol }: Props) {
  const [tab, setTab] = useState<Tab>('RSI');

  if (!data) {
    return (
      <div>
        <h3 className="text-xs text-[#64748B] uppercase tracking-wider mb-3">Technical Indicators</h3>
        <div className="h-40 flex items-center justify-center text-[#64748B] text-sm animate-pulse">Loading indicators…</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-[#64748B] uppercase tracking-wider">Technical Indicators</h3>
        <div className="flex gap-1">
          {(['RSI', 'MACD', 'BBANDS'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2.5 py-1 text-xs rounded font-mono transition-colors ${
                tab === t
                  ? 'bg-[#7C3AED] text-white'
                  : 'text-[#64748B] hover:text-[#E2E8F0] hover:bg-[#1E1E2E]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'RSI' && <RSIChart data={data.rsi.slice(-60)} />}
      {tab === 'MACD' && <MACDChart data={data.macd.slice(-60)} />}
      {tab === 'BBANDS' && <BBandsChart data={data.bbands.slice(-60)} />}
    </div>
  );
}

function RSIChart({ data }: { data: any[] }) {
  if (!data.length) return null;
  const W = 800, H = 120, PAD = { top: 8, right: 8, bottom: 20, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const values = data.map(d => d.RSI);
  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - ((v - 0) / 100) * chartH;

  const linePath = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)}`).join(' ');
  const last = values[values.length - 1];
  const lastColor = last >= 70 ? '#EF4444' : last <= 30 ? '#10B981' : '#A78BFA';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
      {/* Zones */}
      <rect x={PAD.left} y={yScale(70)} width={chartW} height={yScale(50) - yScale(70)} fill="rgba(239,68,68,0.06)" />
      <rect x={PAD.left} y={yScale(50)} width={chartW} height={yScale(30) - yScale(50)} fill="rgba(16,185,129,0.06)" />
      {/* Reference lines */}
      {[30, 50, 70].map(l => (
        <g key={l}>
          <line x1={PAD.left} y1={yScale(l)} x2={PAD.left + chartW} y2={yScale(l)} stroke="#2A2A3E" strokeWidth="0.5" />
          <text x={PAD.left - 4} y={yScale(l) + 4} textAnchor="end" fontSize="8" fill="#475569">{l}</text>
        </g>
      ))}
      <path d={linePath} stroke={lastColor} strokeWidth="1.5" fill="none" />
      <circle cx={xScale(data.length - 1)} cy={yScale(last)} r="3" fill={lastColor} />
      <text x={xScale(data.length - 1) + 6} y={yScale(last) + 4} fontSize="9" fill={lastColor}>
        {last?.toFixed(1)}
      </text>
    </svg>
  );
}

function MACDChart({ data }: { data: any[] }) {
  if (!data.length) return null;
  const W = 800, H = 120, PAD = { top: 8, right: 8, bottom: 20, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const macds = data.map(d => d.MACD);
  const signals = data.map(d => d.MACD_Signal);
  const hists = data.map(d => d.MACD_Hist);

  const all = [...macds, ...signals, ...hists];
  const minV = Math.min(...all) * 1.1;
  const maxV = Math.max(...all) * 1.1;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - ((v - minV) / (maxV - minV)) * chartH;
  const barW = chartW / data.length * 0.8;
  const zero = yScale(0);

  const macdPath = macds.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)}`).join(' ');
  const signalPath = signals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
      <line x1={PAD.left} y1={zero} x2={PAD.left + chartW} y2={zero} stroke="#2A2A3E" strokeWidth="0.5" />
      {hists.map((v, i) => (
        <rect key={i}
          x={xScale(i) - barW / 2} y={v >= 0 ? yScale(v) : zero}
          width={barW} height={Math.abs(yScale(v) - zero)}
          fill={v >= 0 ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}
        />
      ))}
      <path d={macdPath} stroke="#7C3AED" strokeWidth="1.5" fill="none" />
      <path d={signalPath} stroke="#F59E0B" strokeWidth="1" fill="none" strokeDasharray="3,2" />
    </svg>
  );
}

function BBandsChart({ data }: { data: any[] }) {
  if (!data.length) return null;
  const W = 800, H = 120, PAD = { top: 8, right: 8, bottom: 20, left: 56 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const uppers = data.map(d => d['Real Upper Band']);
  const middles = data.map(d => d['Real Middle Band']);
  const lowers = data.map(d => d['Real Lower Band']);

  const minV = Math.min(...lowers) * 0.999;
  const maxV = Math.max(...uppers) * 1.001;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - ((v - minV) / (maxV - minV)) * chartH;

  const path = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)}`).join(' ');

  // Band fill polygon
  const bandPoly = [
    ...uppers.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`),
    ...[...lowers].reverse().map((v, i) => `${xScale(data.length - 1 - i).toFixed(1)},${yScale(v).toFixed(1)}`),
  ].join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
      <polygon points={bandPoly} fill="rgba(124,58,237,0.08)" />
      <path d={path(uppers)} stroke="rgba(124,58,237,0.5)" strokeWidth="1" fill="none" />
      <path d={path(middles)} stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeDasharray="4,3" />
      <path d={path(lowers)} stroke="rgba(124,58,237,0.5)" strokeWidth="1" fill="none" />
      {/* Last value labels */}
      <text x={PAD.left - 4} y={yScale(uppers[uppers.length - 1]) + 4} textAnchor="end" fontSize="8" fill="#7C3AED">
        {uppers[uppers.length - 1]?.toFixed(0)}
      </text>
      <text x={PAD.left - 4} y={yScale(lowers[lowers.length - 1]) + 4} textAnchor="end" fontSize="8" fill="#7C3AED">
        {lowers[lowers.length - 1]?.toFixed(0)}
      </text>
    </svg>
  );
}
