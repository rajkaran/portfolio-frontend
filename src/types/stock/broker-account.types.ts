export type BrokerAccountDTO = {
  id: string;
  broker: string;
  name: string;
};

export type CachedBrokerAccounts = {
  createdAt: number;
  expiresAt: number;
  data: BrokerAccountDTO[];
};
