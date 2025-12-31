export type Market = 'canada' | 'usa' | 'india';
export type StockClass = 'dividend' | 'trade' | 'longTerm';
export type Bucket = 'core' | 'watch' | 'once' | 'avoid';

export type TickerSnapshot = {
  id: string;
  symbol: string; // e.g. "ENB.TO"
  name: string; // e.g. "Enbridge"
  market: Market; // india, canada, usa
  stockClass: StockClass; // dividend, trade
  bucket: Bucket; // core, watch, once, avoid

  currentPrice: number;
  avgBookCost?: number;
  quantityHolding?: number;
  totalReturn?: number;
  amountInvested?: number;
  profit?: number;

  // thresholds
  thresholdGreen: number;
  thresholdCyan: number;
  thresholdOrange: number;
  thresholdRed: number;

  updateDatetime: number; // epoch ms
};

export type TickerLatestDTO = {
  id: string;
  symbol: string;
  symbolId: number;

  companyName?: string;
  market: string;
  stockClasses: string[];
  industry: string;
  bucket: string;

  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  volume: number;
  updateDatetime: Date;

  avgBookCost?: number,
  quantityHolding?: number,
  totalReturn?: number,

  thresholdGreen: number;
  thresholdCyan: number;
  thresholdOrange: number;
  thresholdRed: number;
};


export type TickerDTO = {
  id: string;
  symbol: string;
  companyName: string;
  market: Market;
  stockClasses: StockClass[];
  industry: string;
  bucket: Bucket;
};

export type CreateTickerDTO = Omit<TickerDTO, 'id'>;
export type UpdateTickerDTO = Partial<CreateTickerDTO>;
