import type { TickerOption } from '../../types/stock/ticker.types';

export function resolveTickerSymbol(
  tickers: TickerOption[],
  tickerId: string,
  fallbackSymbol?: string,
): string {
  return tickers.find((t) => t.id === tickerId)?.symbol?.trim() || fallbackSymbol?.trim() || '';
}
