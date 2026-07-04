export type BrokerAccountDTO = {
  id: string;
  broker: string;
  name: string;
  alias: string;
  stockClass: string;
  tradePriority?: number;
  longTermPriority?: number;
};

export type CachedBrokerAccounts = {
  createdAt: number;
  expiresAt: number;
  data: BrokerAccountDTO[];
};
