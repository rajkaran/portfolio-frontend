export type Market = 'canada' | 'usa' | 'india';
export type StockClass = 'dividend' | 'trade' | 'longTerm';
export type Bucket = 'core' | 'watch' | 'once' | 'avoid';

export type ThresholdPatch = Partial<{
  thresholdGreen: number;
  thresholdCyan: number;
  thresholdOrange: number;
  thresholdRed: number;
}>;

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
  updateDatetime: string;

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
