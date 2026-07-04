import { loopbackApi } from './loopback-api';
import { getItem, removeItem, setItem } from '../../utils/common/localStorage';
import type {
  BrokerAccountDTO,
  CachedBrokerAccounts,
} from '../../types/stock/broker-account.types';

const BROKER_ACCOUNTS_CACHE_KEY = 'brokerAccountsCache';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 1 day

export async function fetchBrokerAccounts(): Promise<BrokerAccountDTO[]> {
  const res = await loopbackApi.get<BrokerAccountDTO[]>('/broker-accounts', {
    params: {
      filter: {
        order: ['broker ASC', 'name ASC'],
        where: {
          isActive: true,
        },
        fields: {
          id: true,
          broker: true,
          name: true,
          alias: true,
          stockClass: true,
          tradePriority: true,
          longTermPriority: true,
        },
      },
    },
  });

  return res.data ?? [];
}

export function getCachedBrokerAccounts(): CachedBrokerAccounts | null {
  const result = getItem<CachedBrokerAccounts>(BROKER_ACCOUNTS_CACHE_KEY);
  if (!result) return null;

  if (
    typeof result.expiresAt !== 'number' ||
    !Array.isArray(result.data) ||
    Date.now() >= result.expiresAt
  ) {
    removeItem(BROKER_ACCOUNTS_CACHE_KEY);
    return null;
  }

  return result;
}

export function clearCachedBrokerAccounts() {
  removeItem(BROKER_ACCOUNTS_CACHE_KEY);
}

export async function getBrokerAccountsCached(ttlMs = DEFAULT_TTL_MS): Promise<BrokerAccountDTO[]> {
  const cached = getCachedBrokerAccounts();
  if (cached) {
    return cached.data;
  }

  const fetched = await fetchBrokerAccounts();

  const now = Date.now();
  const nextCached: CachedBrokerAccounts = {
    createdAt: now,
    expiresAt: now + ttlMs,
    data: fetched,
  };

  setItem(BROKER_ACCOUNTS_CACHE_KEY, nextCached);
  return fetched;
}
