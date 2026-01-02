export type TradeType = 'buy' | 'sell';

export type TradeDTO = {
  id: string;
  tickerId: string;
  symbol: string;

  rate: number;
  quantity: number;
  totalAmount: number;

  brokerageFee?: number;
  broker?: string;

  tradeType: TradeType;

  profit?: number;

  tradeDatetime: string;   // ISO
  createDatetime: string;  // ISO

  overrideAvgBookCost?: number;
  overrideQuantityHolding?: number;
};

export type CreateTradeDTO = Omit<TradeDTO, 'id' | 'createDatetime'>;
export type UpdateTradeDTO = Partial<CreateTradeDTO>;
