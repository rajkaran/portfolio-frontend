export type Market = string; // IDs for exchanges stored in db
export type StockClass = string;
export type Bucket = string;
export type BrokerId = string;

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
  lastAppliedTradeDatetime?: string | null;
  anchorTradeDatetime?: string | null;
  isPositionDirty?: boolean | null;
  dirtySinceTradeDatetime?: string | null;
  broker?: string|null;
  name?: string|null;
};

export type TickerLatestDTO = {
  id: string;
  symbol: string;
  companyName?: string;
  market: string;
  stockClasses: string[];
  industryTags: string[];
  bucket: string;

  symbolId?: number | null;
  lastPrice?: number | null;
  bidPrice?: number | null;
  askPrice?: number | null;
  volume?: number | null;
  updateDatetime?: string | null;
  tradeDatetime?: string | null;

  thresholdGreen: number;
  thresholdCyan: number;
  thresholdOrange: number;
  thresholdRed: number;

  positionsByBrokerAccount?: Partial<Record<string, BrokerPositionSnapshotDTO>>;

  // UI-only (stored in state, not backend)
  uiSelectedBroker?: string;

  // keep these derived fields
  avgBookCost?: number | null;
  quantityHolding?: number | null;
  totalReturn?: number;
};

export type TickerDTO = {
  id: string;
  symbol: string;
  companyName: string;
  market: string;
  stockClasses: string[];
  industryTags: string[];
  bucket: string;
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
  market: string;
  stockClass: string;
  sortBy: SortBy;
  symbols: string[]; // e.g. ["WFG.TO", "SHOP.TO"]
};

export const defaultStockFilters: StockFilters = {
  market: '',
  stockClass: '',
  sortBy: 'bucket',
  symbols: [],
};

export type FilterState = {
  market: string;
  stockClass: string;
  buckets: string[];
};

export type FormState = {
  symbol: string;
  companyName: string;
  market: string;
  stockClasses: string[];
  industryTags: string[];
  bucket: string;
};
