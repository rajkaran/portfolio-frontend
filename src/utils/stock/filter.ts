import type { Market, StockClass, TickerSnapshot } from '../../types/stock/ticker.types';

export type SortBy = 'category' | 'mostTraded' | 'gainers' | 'closeToThresholds';

export type StockFilters = {
  market: Market | 'canada';
  stockClass: StockClass | 'trade';
  sortBy: SortBy;
  search: string;
};

export const defaultStockFilters: StockFilters = {
  market: 'canada',
  stockClass: 'trade',
  sortBy: 'category',
  search: '',
};

export function applyFilters(tickers: TickerSnapshot[], filters: StockFilters): TickerSnapshot[] {
  const search = filters.search.trim().toLowerCase();

  return tickers.filter((t) => {
    if (t.market !== filters.market) return false;
    if (t.stockClass !== filters.stockClass) return false;

    if (search) {
      const hay = `${t.symbol} ${t.name}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}
