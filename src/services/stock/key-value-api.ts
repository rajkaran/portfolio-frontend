import { loopbackApi } from './loopback-api';
import { getItem, removeItem, setItem } from '../../utils/common/localStorage';
import type { CachedKeyValuePairs, KeyValueMap } from '../../types/stock/key-value-pairs.types';

const KEY_VALUE_CACHE_KEY = 'keyValuePairsCache';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 1 day

export async function fetchKeyValuePairs(ids: string[]): Promise<KeyValueMap> {
  if (!ids.length) {
    return {};
  }
  const res = await loopbackApi.post<KeyValueMap>('/key-value-pairs/by-ids', { ids });
  return res.data ?? {};
}

export function getCachedKeyValuePairs(): CachedKeyValuePairs | null {
  const result = getItem<CachedKeyValuePairs>(KEY_VALUE_CACHE_KEY);
  if (!result) return null;
  if (typeof result.expiresAt !== 'number' || !result.data || Date.now() >= result.expiresAt) {
    removeItem(KEY_VALUE_CACHE_KEY);
    return null;
  }
  return result;
}

export function clearCachedKeyValuePairs() {
  removeItem(KEY_VALUE_CACHE_KEY);
}

export async function getKeyValuePairsByIdsCached(
  ids: string[],
  ttlMs = DEFAULT_TTL_MS,
): Promise<KeyValueMap> {
  const cached = getCachedKeyValuePairs();
  const missingIds = new Set(ids);
  const mergedData: KeyValueMap = {};

  if (cached) {
    Object.assign(mergedData, cached.data);
    for (const id of ids) {
      if (cached.data[id]) {
        missingIds.delete(id);
      }
    }
  }

  if (missingIds.size === 0) {
    return ids.reduce<KeyValueMap>((acc, id) => {
      if (mergedData[id]) acc[id] = mergedData[id];
      return acc;
    }, {} as KeyValueMap);
  }

  const fetched = await fetchKeyValuePairs(Array.from(missingIds));
  Object.assign(mergedData, fetched);

  const nextCached: CachedKeyValuePairs = {
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
    data: mergedData,
  };
  setItem(KEY_VALUE_CACHE_KEY, nextCached);

  return ids.reduce<KeyValueMap>((acc, id) => {
    if (mergedData[id]) acc[id] = mergedData[id];
    return acc;
  }, {} as KeyValueMap);
}
