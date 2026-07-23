// useStockExchanges.ts
import { useEffect, useState } from 'react';
import { getStockExchangesCached } from '../../services/stock/stock-exchange-api';
import type { StockExchangeDTO } from '../../types/stock/stock-exchange.types';

export function useStockExchanges(enabled = true, ttlMs = 1000 * 60 * 60 * 24) {
  const [data, setData] = useState<StockExchangeDTO[]>([]);
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

    getStockExchangesCached(ttlMs)
      .then((v) => {
        if (!cancelled) {
          setData(v);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to load stock exchanges'));
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
