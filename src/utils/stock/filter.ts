import type { StockFilters, TickerLatestDTO } from '../../types/stock/ticker.types';

export function applyFilters(tickers: TickerLatestDTO[], filters: StockFilters): TickerLatestDTO[] {
  let out = tickers.filter(t =>
    t.market === filters.market &&
    (t.stockClasses?.includes(filters.stockClass) ?? false)
  );

  if (filters.symbols.length) {
    const set = new Set(filters.symbols.map(s => s.toUpperCase()));
    out = out.filter(t => set.has(t.symbol.toUpperCase()));
  }

  return out;
}

export function isDefined<T>(x: T | undefined | null): x is T {
  return x != null;
}

