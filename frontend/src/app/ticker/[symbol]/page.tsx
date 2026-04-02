import TickerPageClient from './TickerPageClient';

// Required for static export: pre-render a set of common tickers.
// The client-side code will dynamically fetch data for any symbol.
export function generateStaticParams() {
  const symbols = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX',
    'INTC', 'AMD', 'JPM', 'BAC', 'GS', 'SPY', 'QQQ', 'BTC', 'ETH',
  ];
  return symbols.map((symbol) => ({ symbol }));
}

export default function TickerPage() {
  return <TickerPageClient />;
}
