export type KeyValueMap = Record<string, Record<string, string>>;

export type CachedKeyValuePairs = {
  createdAt: number;
  expiresAt: number;
  data: KeyValueMap;
};
