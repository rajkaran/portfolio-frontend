export type DividendDialogMode = 'quick' | 'full';

// Mirrors the LoopBack `Dividend` model (see backend src/models/dividend.model.ts)
export type DividendDTO = {
  id: string;
  tickerId: string;
  symbol?: string;
  brokerAccountId: string;

  amount: number; // net cash received
  quantity?: number; // shares held at payout
  ratePerShare?: number;

  reinvested?: boolean; // DRIP flag

  payDatetime: string; // ISO
  lastUpdateDatetime?: string; // ISO
  isEdited?: boolean;
  isActive?: boolean;
  createDatetime?: string; // ISO
};

export type CreateDividendDTO = Omit<
  DividendDTO,
  'id' | 'createDatetime' | 'updatedDatetime' | 'isEdited' | 'isActive'
>;
export type UpdateDividendDTO = Partial<CreateDividendDTO>;
