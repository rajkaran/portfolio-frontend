export type Market = 'canada' | 'usa' | 'india';
export type StockClass = 'dividend' | 'trade';

export type Category = 'core' | 'watch' | 'once' | 'avoid';

export type TickerSnapshot = {
  id: string;
  symbol: string; // e.g. "ENB.TO"
  name: string; // e.g. "Enbridge"
  market: Market; // india, canada, usa
  stockClass: StockClass; // dividend, trade
  category: Category; // core, watch, once, avoid

  currentPrice: number;
  avgBookCost?: number;
  quantityHolding?: number;
  totalReturn?: number;
  amountInvested?: number;

  // thresholds
  thresholdGreen: number;
  thresholdCyan: number;
  thresholdOrange: number;
  thresholdRed: number;

  updateDatetime: number; // epoch ms
};
