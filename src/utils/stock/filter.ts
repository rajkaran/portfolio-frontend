import type { StockFilters, TickerLatestDTO } from '../../types/stock/ticker.types';

export function applyFilters(tickers: TickerLatestDTO[], filters: StockFilters): TickerLatestDTO[] {
  let out = tickers.filter(
    (t) => t.market === filters.market && (t.stockClasses?.includes(filters.stockClass) ?? false),
  );

  if (filters.symbols.length) {
    const set = new Set(filters.symbols.map((s) => s.toUpperCase()));
    out = out.filter((t) => set.has(t.symbol.toUpperCase()));
  }

  return out;
}

export function isDefined<T>(x: T | undefined | null): x is T {
  return x != null;
}

export function getDefaultMarketId(exchanges: { id: string; country: string }[]): string {
  const canadaExchange = exchanges.find((e) => e.country.toLowerCase().includes('canada'));
  return canadaExchange?.id ?? exchanges[0]?.id ?? '';
}

export function getDefaultMarketValue(items: { value: string; label: string }[]): string | '' {
  const canada = items.find((item) => item.value === 'canada');
  return canada?.value ?? items[0]?.value ?? '';
}

export function getDefaultStockClassValue(items: { value: string; label: string }[]): string | '' {
  const trade = items.find((item) => item.value === 'trade');
  return trade?.value ?? items[0]?.value ?? '';
}
