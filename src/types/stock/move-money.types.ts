// currency and operation are driven by data (stock exchange currencies /
// the `moveMoneyDirection` key-value pair) rather than a fixed union, so new
// values can be added on the backend without touching frontend source.
export type MoveMoneyDTO = {
  id: string;
  brokerAccountId: string;

  amount: number;
  currency: string;
  operation: string;

  transferDatetime: string; // ISO — when the transfer happened

  lastUpdateDatetime?: string; // ISO
  isActive?: boolean;
  createDatetime?: string; // ISO
};

export type CreateMoveMoneyDTO = Omit<
  MoveMoneyDTO,
  'id' | 'createDatetime' | 'lastUpdateDatetime' | 'isActive'
>;
export type UpdateMoveMoneyDTO = Partial<CreateMoveMoneyDTO>;
