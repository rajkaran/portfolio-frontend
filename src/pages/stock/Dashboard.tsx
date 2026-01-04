import { Box, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import StockShell from '../../components/stock/layout/StockShell';
import FilterBar from '../../components/stock/dashboard/FilterBar';
import RightFavorableBar from '../../components/stock/dashboard/RightFavorableBar';
import TickerGrid from '../../components/stock/dashboard/TickerGrid';
import { defaultStockFilters, type StockFilters, type TickerLatestDTO } from '../../types/stock/ticker.types';
import { applyFilters } from '../../utils/stock/filter';
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

  // TODO: auto sugges for ticker page using questrade API?
  // TODO: get the quick buy and sell from dahsbord
  // TODO: get the sort workingon dashboard
  // TODO: make trade page look better
  // TODO: add a page to record dividends.
  // TODO: create dividend tiles and notifications through emails
  // TODO: complete favorability bar
  // TODO: get the zoom tooltip on dahsboard working
  // TODO: build the reporting with charts for - dividends over time, investment in dividend over time, total trading retunr over time, weekly average investment in trading.

  // For rendering (stable array)
  const tickers = useMemo(() => Array.from(tickerMap.values()), [tickerMap]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const rows = await listTickerLatest(filters.market, filters.stockClass);
      if (cancelled) return;

      const map = new Map<string, TickerLatestDTO>();
      for (const t of rows) map.set(t.symbol, t);
      setTickerMap(map);
    })().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [filters.market, filters.stockClass]);

  useEffect(() => {
    const wsHandle = connectPricesWs({
      onStatus: (s) => setWsConnected(s.connected),
      onPriceUpdate: (u: PriceUpdateDTO) => {
        setTickerMap((prev) => {
          const existing = prev.get(u.symbol);
          if (!existing) return prev; // ignore tickers not in current snapshot

          const next = new Map(prev);
          const last = u.last ?? existing.lastPrice;

          let totalReturn = 0;
          if (existing.quantityHolding && existing.quantityHolding > 0) {
            totalReturn =
              last * existing.quantityHolding -
              (existing.avgBookCost ?? 0) * existing.quantityHolding;
          }

          next.set(u.symbol, {
            ...existing,
            lastPrice: last,
            bidPrice: u.bid ?? existing.bidPrice,
            askPrice: u.ask ?? existing.askPrice,
            volume: u.volume ?? existing.volume,
            updateDatetime: u.tradeDatetime,
            tradeDatetime: u.tradeDatetime,
            totalReturn,
            symbolId: u.symbolId ?? existing.symbolId,
          });

          return next;
        });
      },
    });

    return () => wsHandle.close();
  }, []);

  const visibleTickers = useMemo(() => {
    const filtered = applyFilters(tickers, filters);
    return filtered.sort((a, b) => favorabilityScore(b) - favorabilityScore(a));
  }, [tickers, filters]);

  const onFiltersChange = (next: StockFilters) => {
    const marketChanged = next.market !== filters.market;
    const classChanged = next.stockClass !== filters.stockClass;

    if (marketChanged || classChanged) {
      next = { ...next, symbols: [] };
    }
    setFilters(next);
  };

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
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          WS: {wsConnected ? 'connected' : 'disconnected'}
        </Typography>
      </Box>

      <Box>
        <FilterBar value={filters} onChange={onFiltersChange} tickers={tickers} />
      </Box>

      <TickerGrid tickers={visibleTickers} onZoom={onZoom} onTrade={onTrade} onChangeThreshold={onChangeThreshold} />

      <TickerCardTooltip open={Boolean(zoomTickerId)} anchorEl={zoomAnchorEl} ticker={zoomTicker} onClose={closeZoom} />

    </StockShell>
  );
}
