import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";

import StockShell from '../../components/stock/layout/StockShell';
import FilterBar from '../../components/stock/dashboard/FilterBar';
import RightFavorableBar from '../../components/stock/dashboard/RightFavorableBar';
import TickerGrid from '../../components/stock/dashboard/TickerGrid';
import { defaultStockFilters, type BrokerId, type StockFilters, type TickerLatestDTO, type TickerOption } from '../../types/stock/ticker.types';
import { applyFilters } from '../../utils/stock/filter';
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
import { compareBySort, isFavorable } from '../../utils/stock/tickerSorting';
import { enableSound, playChime } from '../../utils/stock/chimes';

const toIso = (v: string | Date | null | undefined) =>
  !v ? null : (typeof v === 'string' ? new Date(v).toISOString() : v.toISOString());

type ChimeKey = "green" | "cyan" | "orange" | "red";

export default function Dashboard() {
  const { showSnackbar } = useSnackbar();
  const { options } = useTickerOptions(true);

  const [filters, setFilters] = useState(defaultStockFilters);
  const [zoomTickerId, setZoomTickerId] = useState<string | null>(null);
  const [zoomAnchorEl, setZoomAnchorEl] = useState<HTMLElement | null>(null);
  const [silencedById, setSilencedById] = useState<Record<string, boolean>>({});
  const [soundEnabled, setSoundEnabled] = useState(false);

  // snapshot state
  const [tickerMap, setTickerMap] = useState<Map<string, TickerLatestDTO>>(new Map());
  const [wsConnected, setWsConnected] = useState(false);

  // QUICK TRADE dialog state
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeTickerId, setTradeTickerId] = useState<string | null>(null);
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');

  // last seen lastPrice per symbol
  const lastPriceRef = useRef<Record<string, number>>({});

  // prevents initial-load ding
  const initializedRef = useRef<Record<string, boolean>>({});

  // per symbol “armed state” (true means we’ve already rung for current side)
  const chimeStateRef = useRef<Record<string, Partial<Record<ChimeKey, boolean>>>>({});

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

          // --- Chime logic (re-armable crossings) ---
          // Only run if we have a numeric new price this tick.
          const nextPrice = typeof updated.lastPrice === "number" ? updated.lastPrice : null;
          if (nextPrice != null) {
            const sym = updated.symbol;
            const prevPrice = lastPriceRef.current[sym];

            // skip first observation (no initial chimes)
            const isInitialized = initializedRef.current[sym] === true;

            if (soundEnabled && isInitialized && typeof prevPrice === "number") {
              const green = typeof updated.thresholdGreen === "number" ? updated.thresholdGreen : null;
              const cyan = typeof updated.thresholdCyan === "number" ? updated.thresholdCyan : null;
              const orange = typeof updated.thresholdOrange === "number" ? updated.thresholdOrange : null;
              const red = typeof updated.thresholdRed === "number" ? updated.thresholdRed : null;

              const st = (chimeStateRef.current[sym] ??= {});

              // ----- SELL thresholds: ring only on upward cross -----
              const crossedUpGreen =
                green != null && prevPrice < green && nextPrice >= green && !st.green;

              const crossedUpCyan =
                cyan != null && prevPrice < cyan && nextPrice >= cyan && !st.cyan;

              // precedence: green first, then cyan
              if (crossedUpGreen) {
                playChime("green");
                st.green = true;
                st.cyan = true; // above green implies above cyan (avoid later cyan ding)
              } else if (crossedUpCyan) {
                playChime("cyan");
                st.cyan = true;
              }

              // re-arm when price drops back below threshold
              if (green != null && nextPrice < green) st.green = false;
              if (cyan != null && nextPrice < cyan) st.cyan = false;

              // ----- BUY thresholds: ring only on downward cross -----
              const crossedDownRed =
                red != null && prevPrice > red && nextPrice <= red && !st.red;

              const crossedDownOrange =
                orange != null && prevPrice > orange && nextPrice <= orange && !st.orange;

              // precedence: red first, then orange
              if (crossedDownRed) {
                playChime("red");
                st.red = true;
                st.orange = true; // below red implies below orange (avoid later orange ding)
              } else if (crossedDownOrange) {
                playChime("orange");
                st.orange = true;
              }

              // re-arm when price recovers back above threshold
              if (red != null && nextPrice > red) st.red = false;
              if (orange != null && nextPrice > orange) st.orange = false;
            }

            // update trackers
            initializedRef.current[sym] = true;
            lastPriceRef.current[sym] = nextPrice;
          }

          // --- commit to map ---
          const next = new Map(prev);
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
    return [...filtered].sort((a, b) =>
      compareBySort(a, b, filters.sortBy, { silencedById })
    );
  }, [tickers, filters, silencedById]);

  const toggleSilenced = useCallback((tickerId: string) => {
    setSilencedById((prev) => ({ ...prev, [tickerId]: !prev[tickerId] }));
  }, []);

  // Persist silences across refresh
  useEffect(() => {
    const raw = localStorage.getItem("silencedById");
    if (raw) setSilencedById(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem("silencedById", JSON.stringify(silencedById));
  }, [silencedById]);

  const toggleSound = async () => {
    if (soundEnabled) {
      setSoundEnabled(false);
      return;
    }

    // turning ON: must unlock audio context (requires a user gesture)
    try {
      await enableSound();
      setSoundEnabled(true);
      // optional confirmation chirp
      playChime("cyan");
    } catch (e) {
      console.error("Failed to enable sound", e);
    }
  };

  const favorableTickers = useMemo(() => {
    const fav = tickers
      .filter(t => isFavorable(t, { silencedBuy: !!silencedById[t.id] }))
      .sort((a, b) => compareBySort(a, b, "favorability", { silencedById }));

    // Cap the Favorable bar list (so it doesn’t become an infinite scroll on wild days):
    return fav.slice(0, 20);
  }, [tickers, silencedById]);

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
    <StockShell
      right={({ closeRight }) => (
        <RightFavorableBar
          onClose={closeRight}
          tickers={favorableTickers}
          brokerLabels={brokerLabels}
          onTrade={(tickerId, side) => openQuickTrade(tickerId, side)}
          onChangeThreshold={onChangeThreshold}
          onSelectBroker={onSelectBroker}
          silencedById={silencedById}
          onToggleSilence={toggleSilenced}
        />
      )}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Dashboard
        </Typography>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
          <Tooltip title={soundEnabled ? "Sound: ON (click to mute)" : "Sound: OFF (click to enable)"}>
            <IconButton
              size="small"
              onClick={toggleSound}
              aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
              sx={{ p: 0.25 }}
            >
              {soundEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            WS: {wsConnected ? "connected" : "disconnected"}
          </Typography>
        </Box>
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
        silencedById={silencedById}
        onToggleSilence={toggleSilenced}
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
