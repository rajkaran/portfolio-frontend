export type TradeType = 'buy' | 'sell';

export type QuickTradeRequest = {
  symbol: string;
  rate: number;
  quantity: number;
  totalAmount: number;
  brokerageFee: number;
  broker: string;
  type: TradeType;
  profit?: number;
};
