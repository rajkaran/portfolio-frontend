export type Market = 'canada' | 'usa' | 'india';
export type StockClass = 'dividend' | 'trade' | 'longTerm';
export type Bucket = 'core' | 'watch' | 'once' | 'avoid';
export type BrokerId = 'wealthsimple' | 'questrade' | 'td';

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

export type BrokerPositionSnapshotDTO = {
  avgBookCost?: number | null;
  quantityHolding?: number | null;
  lastAppliedTradeDatetime?: string | Date | null;
  anchorTradeDatetime?: string | Date | null;
  isPositionDirty?: boolean | null;
  dirtySinceTradeDatetime?: string | Date | null;
};

export type TickerLatestDTO = {
  id: string;
  symbol: string;
  companyName?: string;
  market: string;
  stockClasses: string[];
  industry: string;
  bucket: string;

  symbolId?: number | null;
  lastPrice?: number | null;
  bidPrice?: number | null;
  askPrice?: number | null;
  volume?: number | null;
  updateDatetime?: string | Date | null;
  tradeDatetime?: string | Date | null;

  thresholdGreen: number;
  thresholdCyan: number;
  thresholdOrange: number;
  thresholdRed: number;

  positionsByBroker?: Partial<Record<BrokerId, BrokerPositionSnapshotDTO>>;

  // UI-only (stored in state, not backend)
  uiSelectedBroker?: BrokerId;

  // keep these derived fields
  avgBookCost?: number | null;
  quantityHolding?: number | null;
  totalReturn?: number;
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

export type SymbolSuggestDTO = {
  symbolId: number;
  symbol: string;
  description?: string;
  lastPrice?: number | null;
  bidPrice?: number | null;
  askPrice?: number | null;
  volume?: number | null;
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
