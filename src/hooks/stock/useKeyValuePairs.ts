import { useEffect, useMemo, useState } from 'react';
import { getKeyValuePairsByIdsCached } from '../../services/stock/key-value-api';
import type { KeyValueMap } from '../../types/stock/key-value-pairs.types';

export function useKeyValuePairs(ids: string[], enabled = true, ttlMs = 1000 * 60 * 60 * 24) {
  const normalizedIds = useMemo(
    () => Array.from(new Set(ids.filter(Boolean))).sort(),
    [ids.join('|')],
  );

  const idsKey = useMemo(() => normalizedIds.join('|'), [normalizedIds]);

  const [data, setData] = useState<KeyValueMap>({});
  const [loading, setLoading] = useState<boolean>(enabled && normalizedIds.length > 0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || normalizedIds.length === 0) {
      setData({});
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getKeyValuePairsByIdsCached(normalizedIds, ttlMs)
      .then((v) => {
        if (!cancelled) {
          setData(v);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load key-value pairs'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey, enabled, ttlMs]);

  return { data, loading, error };
}
