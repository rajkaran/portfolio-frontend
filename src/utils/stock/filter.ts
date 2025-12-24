import type { Market, StockClass, TickerSnapshot } from '../../types/stock/ticker.types';

export type SortBy = 'category' | 'mostTraded' | 'gainers' | 'closeToThresholds';

export type StockFilters = {
  market: Market | 'all';
  stockClass: StockClass | 'all';
  sortBy: SortBy;
  search: string;
};

export const defaultStockFilters: StockFilters = {
  market: 'all',
  stockClass: 'all',
  sortBy: 'category',
  search: '',
};

export function applyFilters(tickers: TickerSnapshot[], filters: StockFilters): TickerSnapshot[] {
  const search = filters.search.trim().toLowerCase();

  return tickers.filter((t) => {
    if (filters.market !== 'all' && t.market !== filters.market) return false;
    if (filters.stockClass !== 'all' && t.stockClass !== filters.stockClass) return false;

    if (search) {
      const hay = `${t.symbol} ${t.name}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}
