export type StockExchangeDTO = {
  id: string;
  country: string;
  exchange: string;
  currency: string;
};

export type CachedStockExchanges = {
  createdAt: number;
  expiresAt: number;
  data: StockExchangeDTO[];
};
