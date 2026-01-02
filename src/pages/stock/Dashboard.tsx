import { Box, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import StockShell from '../../components/stock/layout/StockShell';
import FilterBar from '../../components/stock/dashboard/FilterBar';
import RightFavorableBar from '../../components/stock/dashboard/RightFavorableBar';
import TickerGrid from '../../components/stock/dashboard/TickerGrid';
import type { TickerLatestDTO } from '../../types/stock/ticker.types';
import { applyFilters, defaultStockFilters } from '../../utils/stock/filter';
import { favorabilityScore } from '../../utils/stock/favorability';
import TickerCardTooltip from '../../components/stock/dashboard/TickerDetailTooltip';
import { listTickerLatest } from '../../services/stock/ticker-api';
import { connectPricesWs } from '../../services/stock/prices-ws';
import type { PriceUpdateDTO } from '../../types/stock/price-update.types';
import { patchTickerThresholds } from '../../services/stock/ticker-api';
import { useSnackbar } from '../../components/common/SnackbarProvider';
import type { ThresholdKey } from '../../constants/stockUI';

export default function Dashboard() {
  const { showSnackbar } = useSnackbar();

  const [filters, setFilters] = useState(defaultStockFilters);
  const [zoomTickerId, setZoomTickerId] = useState<string | null>(null);
  const [zoomAnchorEl, setZoomAnchorEl] = useState<HTMLElement | null>(null);

  const [tickerMap, setTickerMap] = useState<Map<string, TickerLatestDTO>>(new Map());
  const [wsConnected, setWsConnected] = useState(false);

  // For rendering (stable array)
  const tickers = useMemo(() => Array.from(tickerMap.values()), [tickerMap]);

  useEffect(() => {
    let wsHandle: { close: () => void } | null = null;
    let cancelled = false;

    (async () => {
      // 1) initial snapshot
      const rows: TickerLatestDTO[] = await listTickerLatest();
      if (cancelled) return;

      const map = new Map<string, TickerLatestDTO>();
      for (const t of rows) map.set(t.symbol, t);
      setTickerMap(map);

      // 2) websocket updates
      wsHandle = connectPricesWs({
        onStatus: (s) => setWsConnected(s.connected),
        onPriceUpdate: (u: PriceUpdateDTO) => {
          setTickerMap((prev) => {
            const existing = prev.get(u.symbol);
            if (!existing) return prev;

            let totalReturn = 0;
            if (existing.quantityHolding && existing.quantityHolding > 0) {
              totalReturn = (u.last ?? existing.lastPrice) * existing.quantityHolding - (existing.avgBookCost ?? 0) * existing.quantityHolding;
            }

            const next = new Map(prev);
            next.set(u.symbol, {
              ...existing,
              lastPrice: u.last ?? existing.lastPrice,
              bidPrice: u.bid ?? existing.bidPrice,
              askPrice: u.ask ?? existing.askPrice,
              volume: u.volume ?? existing.volume,
              updateDatetime: u.tradeDatetime,
              avgBookCost: existing.avgBookCost,
              quantityHolding: existing.quantityHolding ?? 0,
              totalReturn: totalReturn,
              symbolId: u.symbolId ?? existing.symbolId,
            });
            return next;
          });
        },
      });
    })().catch(console.error);

    return () => {
      cancelled = true;
      wsHandle?.close();
    };
  }, []);

  const visibleTickers = useMemo(() => {
    const filtered = applyFilters(tickers, filters);
    // temporary sort logic
    return filtered.sort((a, b) => favorabilityScore(b) - favorabilityScore(a));
  }, [filters]);

  const zoomTicker = useMemo(() => {
    if (!zoomTickerId) return null;
    return visibleTickers.find((t) => t.id === zoomTickerId) ?? null;
  }, [zoomTickerId, visibleTickers])

  const onZoom = (id: string, anchorEl: HTMLElement | null) => {
    setZoomTickerId(id);
    setZoomAnchorEl(anchorEl);
  };

  const closeZoom = () => {
    setZoomTickerId(null);
    setZoomAnchorEl(null);
  };

  const onTrade = (id: string, side: 'buy' | 'sell') => {
    console.log('trade', { id, side });
  };

  const onChangeThreshold = async (tickerId: string, key: ThresholdKey, value: number) => {
    // 1) optimistic update
    let previous: number | undefined;

    setTickerMap((prevMap) => {
      const next = new Map(prevMap);

      // your map is keyed by symbol, so we need to locate the ticker by id
      for (const [sym, t] of next.entries()) {
        if (t.id === tickerId) {
          previous = (t as any)[key] as number | undefined;
          next.set(sym, { ...t, [key]: value } as any);
          break;
        }
      }

      return next;
    });

    // 2) persist to backend
    try {
      await patchTickerThresholds(tickerId, { [key]: value } as any);
      // optional: show a tiny success toast or skip to avoid spam
      // showSnackbar('Threshold updated', { severity: 'success' });
    } catch (e) {
      // rollback on failure
      setTickerMap((prevMap) => {
        const next = new Map(prevMap);
        for (const [sym, t] of next.entries()) {
          if (t.id === tickerId) {
            next.set(sym, { ...t, [key]: previous } as any);
            break;
          }
        }
        return next;
      });

      showSnackbar('Failed to save threshold. Rolled back.', { severity: 'error' });
      console.error(e);
    }
  };

  return (
    <StockShell right={({ closeRight }) => <RightFavorableBar onClose={closeRight} />} >
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 2 }}>
        Dashboard
      </Typography>

      <Box>
        <FilterBar value={filters} onChange={setFilters} />
      </Box>

      <TickerGrid tickers={tickers} onZoom={onZoom} onTrade={onTrade} onChangeThreshold={onChangeThreshold} />

      <TickerCardTooltip
        open={Boolean(zoomTickerId)}
        anchorEl={zoomAnchorEl}
        ticker={zoomTicker}
        onClose={closeZoom}
      />

    </StockShell>
  );
}
