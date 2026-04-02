'use client';
import type { NewsData } from '@/lib/types';

interface Props { data: NewsData | null; }

function timeAgo(ts: string): string {
  try {
    // Format: 20240115T160000
    const d = new Date(`${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)}T${ts.slice(9,11)}:${ts.slice(11,13)}`);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return ts.slice(0, 8); }
}

function sentimentColor(score: number): string {
  if (score >= 0.35) return '#10B981';
  if (score >= 0.15) return '#6EE7B7';
  if (score >= -0.15) return '#64748B';
  if (score >= -0.35) return '#FCA5A5';
  return '#EF4444';
}

export default function NewsFeed({ data }: Props) {
  if (!data) return <div className="animate-pulse text-[#64748B] text-sm p-4">Loading news…</div>;

  const { articles, aggregateSentiment } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-[#64748B] uppercase tracking-wider">News & Sentiment</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#64748B]">Aggregate:</span>
          <span className="text-xs font-mono font-bold" style={{ color: sentimentColor(aggregateSentiment.score) }}>
            {aggregateSentiment.label}
          </span>
          <span className="text-xs text-[#475569]">({aggregateSentiment.count})</span>
        </div>
      </div>

      {/* Sentiment bar */}
      <div className="h-1 bg-[#2A2A3E] rounded mb-3 overflow-hidden">
        <div
          className="h-full rounded transition-all"
          style={{
            width: `${Math.abs(aggregateSentiment.score) * 100}%`,
            marginLeft: aggregateSentiment.score < 0 ? `${(0.5 + aggregateSentiment.score / 2) * 100}%` : '50%',
            background: sentimentColor(aggregateSentiment.score),
          }}
        />
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {articles.slice(0, 15).map((a, i) => (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2.5 bg-[#1E1E2E] rounded border border-[#2A2A3E] hover:border-[#3A3A50] transition-colors group"
          >
            <div className="flex items-start gap-2">
              {/* Sentiment indicator */}
              <div
                className="w-1 rounded-full flex-shrink-0 mt-0.5"
                style={{
                  height: '100%',
                  minHeight: '32px',
                  background: sentimentColor(a.overallSentimentScore),
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#E2E8F0] line-clamp-2 group-hover:text-white transition-colors">
                  {a.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#475569]">{a.source}</span>
                  <span className="text-[10px] text-[#3A3A50]">·</span>
                  <span className="text-[10px] text-[#475569]">{timeAgo(a.publishedAt)}</span>
                  <span className="text-[10px] text-[#3A3A50]">·</span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: sentimentColor(a.overallSentimentScore) }}
                  >
                    {a.overallSentimentLabel}
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
