export type TradeType = 'buy' | 'sell';
export type TradeDialogMode = 'quick' | 'full';

export type TradeDTO = {
  id: string;
  tickerId: string;
  symbol: string;

  rate: number;
  quantity: number;
  totalAmount?: number;

  brokerageFee?: number;
  brokerAccountId?: string;

  tradeType: TradeType;

  profit?: number;

  tradeDatetime: string; // ISO
  createDatetime: string; // ISO
};

export type CreateTradeDTO = Omit<TradeDTO, 'id' | 'createDatetime'>;
export type UpdateTradeDTO = Partial<CreateTradeDTO>;

export type TradeWsMsg = {
  type: 'trade';
  symbol: string;
  patch: {
    brokerAccountId: string;
    avgBookCost?: number | null;
    quantityHolding?: number | null;
  };
  ts?: string;
};
