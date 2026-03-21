// useBrokerAccounts.ts
import { useEffect, useState } from 'react';
import { getBrokerAccountsCached } from '../../services/stock/broker-account-api';
import type { BrokerAccountDTO } from '../../types/stock/broker-account.types';

export function useBrokerAccounts(enabled = true, ttlMs = 1000 * 60 * 60 * 24) {
  const [data, setData] = useState<BrokerAccountDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getBrokerAccountsCached(ttlMs)
      .then((rows) => {
        if (!cancelled) setData(rows);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load broker accounts'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, ttlMs]);

  return { data, loading, error };
}
