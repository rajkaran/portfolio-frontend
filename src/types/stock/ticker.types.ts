export type Market = 'canada' | 'usa' | 'india';
export type StockClass = 'dividend' | 'trade' | 'longTerm';
export type Bucket = 'core' | 'watch' | 'once' | 'avoid';

export type ThresholdPatch = Partial<{
  thresholdGreen: number;
  thresholdCyan: number;
  thresholdOrange: number;
  thresholdRed: number;
}>;

// input to the AutoSuggest for ticker
export type TickerOption = {
  id: string;
  symbol: string;
  companyName?: string;
  bucket?: string;
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
  updateDatetime: string;
  tradeDatetime: string;

  avgBookCost?: number,
  quantityHolding?: number,
  totalReturn?: number,

  thresholdGreen: number;
  thresholdCyan: number;
  thresholdOrange: number;
  thresholdRed: number;
};

export type SortBy = 'az' | 'za' | 'bucket' | 'favorability';

export type StockFilters = {
  market: Market;
  stockClass: StockClass;
  sortBy: SortBy;
  symbols: string[]; // e.g. ["WFG.TO", "SHOP.TO"]
};

export const defaultStockFilters: StockFilters = {
  market: 'canada',
  stockClass: 'trade',
  sortBy: 'az',
  symbols: [],
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
