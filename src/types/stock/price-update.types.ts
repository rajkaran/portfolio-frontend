export type PriceUpdateDTO = {
  symbol: string;
  symbolId: number;
  last?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  tradeDatetime: string;
};
