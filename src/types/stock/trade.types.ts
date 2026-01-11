import type { BrokerId } from "./ticker.types";

export type TradeType = 'buy' | 'sell';
export type TradeDialogMode = 'quick' | 'full';
export type Broker = 'wealthsimple' | 'questrade' | 'td' ;

export type TradeDTO = {
  id: string;
  tickerId: string;
  symbol: string;

  rate: number;
  quantity: number;
  totalAmount?: number;

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

export type TradeWsMsg = {
  type: 'trade';
  symbol: string;
  patch: {
    broker: BrokerId;
    avgBookCost?: number | null;
    quantityHolding?: number | null;
  };
  ts?: string;
};
