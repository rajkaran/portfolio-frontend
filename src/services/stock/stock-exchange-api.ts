// stock-exchange-api.ts
import { loopbackApi } from './loopback-api';
import { getItem, removeItem, setItem } from '../../utils/common/localStorage';
import type {
  CachedStockExchanges,
  StockExchangeDTO,
} from '../../types/stock/stock-exchange.types';

const STOCK_EXCHANGES_CACHE_KEY = 'stockExchangesCache';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 1 day

export async function fetchStockExchanges(): Promise<StockExchangeDTO[]> {
  const res = await loopbackApi.get<StockExchangeDTO[]>('/stock-exchanges', {
    params: {
      filter: {
        order: 'country',
        where: {
          isActive: true,
        },
        fields: {
          id: true,
          country: true,
          exchange: true,
          currency: true,
        },
      },
    },
  });

  return res.data ?? [];
}

export function getCachedStockExchanges(): CachedStockExchanges | null {
  const result = getItem<CachedStockExchanges>(STOCK_EXCHANGES_CACHE_KEY);
  if (!result) return null;

  if (
    typeof result.expiresAt !== 'number' ||
    !Array.isArray(result.data) ||
    Date.now() >= result.expiresAt
  ) {
    removeItem(STOCK_EXCHANGES_CACHE_KEY);
    return null;
  }

  return result;
}

export function clearCachedStockExchanges() {
  removeItem(STOCK_EXCHANGES_CACHE_KEY);
}

export async function getStockExchangesCached(ttlMs = DEFAULT_TTL_MS): Promise<StockExchangeDTO[]> {
  const cached = getCachedStockExchanges();
  if (cached) {
    return cached.data;
  }

  const fetched = await fetchStockExchanges();

  const now = Date.now();
  const nextCached: CachedStockExchanges = {
    createdAt: now,
    expiresAt: now + ttlMs,
    data: fetched,
  };

  setItem(STOCK_EXCHANGES_CACHE_KEY, nextCached);
  return fetched;
}
