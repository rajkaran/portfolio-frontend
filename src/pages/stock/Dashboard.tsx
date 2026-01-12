import { Box, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';

import StockShell from '../../components/stock/layout/StockShell';
import FilterBar from '../../components/stock/dashboard/FilterBar';
import RightFavorableBar from '../../components/stock/dashboard/RightFavorableBar';
import TickerGrid from '../../components/stock/dashboard/TickerGrid';
import { defaultStockFilters, type BrokerId, type StockFilters, type TickerLatestDTO, type TickerOption } from '../../types/stock/ticker.types';
import { applyFilters } from '../../utils/stock/filter';
import { favorabilityScore } from '../../utils/stock/favorability';
import TickerCardTooltip from '../../components/stock/dashboard/TickerDetailTooltip';
import { listTickerLatest } from '../../services/stock/ticker-api';
import { connectPricesWs } from '../../services/stock/prices-ws';
import type { PriceUpdateDTO } from '../../types/stock/price-update.types';
import { patchTickerThresholds } from '../../services/stock/ticker-api';
import { useSnackbar } from '../../components/common/SnackbarProvider';
import type { ThresholdKey } from '../../constants/stockUI';
import { CreateTradeDialog } from '../../components/stock/shared/CreateTradeDialog';
import type { TradeType, TradeWsMsg } from '../../types/stock/trade.types';
import { useTickerOptions } from '../../hooks/stock/useTickerOptions';
import { derivePositionFields, pickDefaultBroker } from '../../utils/stock/DashboardUtil';
import type { BrokerItem } from '../../components/stock/shared/BrokerSelect';

const toIso = (v: string | Date | null | undefined) =>
  !v ? null : (typeof v === 'string' ? new Date(v).toISOString() : v.toISOString());

export default function Dashboard() {
  const { showSnackbar } = useSnackbar();
  const { options } = useTickerOptions(true);

  const [filters, setFilters] = useState(defaultStockFilters);
  const [zoomTickerId, setZoomTickerId] = useState<string | null>(null);
  const [zoomAnchorEl, setZoomAnchorEl] = useState<HTMLElement | null>(null);

  // snapshot state
  const [tickerMap, setTickerMap] = useState<Map<string, TickerLatestDTO>>(new Map());
  const [wsConnected, setWsConnected] = useState(false);

  // QUICK TRADE dialog state
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeTickerId, setTradeTickerId] = useState<string | null>(null);
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');


  // TODO: get the sort working on dashboard
  // TODO: add a page to record dividends.
  // TODO: create dividend tiles and notifications through emails
  // TODO: complete favorability bar
  // TODO: get the zoom tooltip on dahsboard working
  // TODO: build the reporting with charts for - dividends over time, investment in dividend over time, total trading retunr over time, weekly average investment in trading.

  // For rendering (stable array)
  const tickers = useMemo(() => Array.from(tickerMap.values()), [tickerMap]);

  // tickers for CreateTradeDialog (needs TickerOption shape)
  const tickerOptions: TickerOption[] = useMemo(
    () =>
      tickers.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        companyName: t.companyName,
        bucket: t.bucket,
      })),
    [tickers]
  );

  // known brokers
  const brokerItems: BrokerItem[] = useMemo(() => {
    if (!options?.broker) return [];
    return Object.entries(options.broker).map(([value, label]) => ({
      value: value as BrokerId,
      label: String(label),
    }));
  }, [options]);

  const brokerLabels = useMemo(() => {
    const m = {} as Record<BrokerId, string>;
    for (const [value, label] of Object.entries(options?.broker ?? {})) {
      m[value as BrokerId] = String(label);
    }
    return m;
  }, [options]);

  // ---- initial fetch
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const rows = await listTickerLatest(filters.market, filters.stockClass);
      if (cancelled) return;

      const map = new Map<string, TickerLatestDTO>();

      for (const raw of rows as TickerLatestDTO[]) {
        const normalized: TickerLatestDTO = {
          ...raw,
          positionsByBroker: raw.positionsByBroker ?? {},
          updateDatetime: toIso(raw.updateDatetime),
          tradeDatetime: toIso(raw.tradeDatetime),
        };

        const selected = normalized.uiSelectedBroker ?? pickDefaultBroker(normalized);
        const derived = derivePositionFields(normalized, selected);

        map.set(normalized.symbol, {
          ...normalized,
          uiSelectedBroker: selected,
          ...derived,
        });
      }

      setTickerMap(map);
    })().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [filters.market, filters.stockClass]);

  // ---- websocket connect
  useEffect(() => {
    const wsHandle = connectPricesWs({
      onStatus: (s) => setWsConnected(s.connected),

      onPriceUpdate: (u: PriceUpdateDTO) => {
        setTickerMap((prev) => {
          const existing = prev.get(u.symbol);
          if (!existing) return prev; // ignore tickers not in current snapshot

          const next = new Map(prev);

          const updated: TickerLatestDTO = {
            ...existing,
            lastPrice: u.last ?? existing.lastPrice,
            bidPrice: u.bid ?? existing.bidPrice,
            askPrice: u.ask ?? existing.askPrice,
            volume: u.volume ?? existing.volume,
            updateDatetime: toIso(u.tradeDatetime),
            tradeDatetime: toIso(u.tradeDatetime),
            symbolId: u.symbolId ?? existing.symbolId,
          };

          // recompute totalReturn based on selected broker snapshot (derived fields)
          const selected = updated.uiSelectedBroker ?? pickDefaultBroker(updated);
          updated.uiSelectedBroker = selected;
          Object.assign(updated, derivePositionFields(updated, selected));

          next.set(u.symbol, updated);

          return next;
        });
      },

      onTrade: (m: TradeWsMsg) => {
        setTickerMap((prev) => {
          const existing = prev.get(m.symbol);
          if (!existing) return prev; // not in current snapshot

          const next = new Map(prev);

          const broker = m.patch.broker; // BrokerId
          const prevPos = existing.positionsByBroker ?? {};
          const prevSnap = prevPos[broker] ?? {};

          // apply patch
          const nextSnap = {
            ...prevSnap,
            ...(m.patch.avgBookCost !== undefined ? { avgBookCost: m.patch.avgBookCost ?? null } : {}),
            ...(m.patch.quantityHolding !== undefined ? { quantityHolding: m.patch.quantityHolding ?? null } : {}),
          };

          const updated: TickerLatestDTO = {
            ...existing,
            positionsByBroker: {
              ...prevPos,
              [broker]: nextSnap,
            },
          };

          // keep selection stable, but ensure it exists
          const selected = updated.uiSelectedBroker ?? pickDefaultBroker(updated);
          updated.uiSelectedBroker = selected;

          // If selected broker changed in the event OR selection was missing, recompute derived fields.
          // (Also fine to always recompute; it's cheap.)
          Object.assign(updated, derivePositionFields(updated, selected));

          next.set(m.symbol, updated);
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

  const onSelectBroker = useCallback((tickerSymbol: string, broker: BrokerId) => {
    setTickerMap((prev) => {
      const existing = prev.get(tickerSymbol);
      if (!existing) return prev;

      const next = new Map(prev);
      const updated: TickerLatestDTO = {
        ...existing,
        uiSelectedBroker: broker,
        ...derivePositionFields(existing, broker),
      };

      next.set(tickerSymbol, updated);
      return next;
    });
  }, []);

  const openQuickTrade = useCallback((tickerId: string, side: 'buy' | 'sell') => {
    setTradeTickerId(tickerId);
    setTradeSide(side);
    setTradeOpen(true);
  }, []);

  const closeQuickTrade = useCallback(() => {
    setTradeOpen(false);
    setTradeTickerId(null);
  }, []);

  const onChangeThreshold = async (tickerId: string, key: ThresholdKey, value: number) => {
    // optimistic update
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

    // persist to backend
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

      <TickerGrid
        tickers={visibleTickers}
        brokerLabels={brokerLabels}
        onZoom={onZoom}
        onTrade={(tickerId: string, side: TradeType) => openQuickTrade(tickerId, side)}
        onChangeThreshold={onChangeThreshold}
        onSelectBroker={onSelectBroker}
      />

      <TickerCardTooltip open={Boolean(zoomTickerId)} anchorEl={zoomAnchorEl} ticker={zoomTicker} onClose={closeZoom} />

      {/* Quick trade dialog */}
      <CreateTradeDialog
        open={tradeOpen}
        onClose={closeQuickTrade}
        mode="quick"
        tickers={tickerOptions}
        brokerItems={brokerItems}
        fixedTickerId={tradeTickerId ?? undefined}
        presetType={tradeSide}
      />

    </StockShell>
  );
}
