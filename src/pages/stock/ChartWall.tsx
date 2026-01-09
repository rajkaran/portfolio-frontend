import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

import StockShell from '../../components/stock/layout/StockShell';
import type { Bucket, Market, StockClass, TickerDTO, TickerOption } from '../../types/stock/ticker.types';
import type { PriceUpdateDTO } from '../../types/stock/price-update.types';

import { listTickers } from '../../services/stock/ticker-api';
import { fetchChartSeries } from '../../services/stock/price-log-api';
import { connectPricesWs } from '../../services/stock/prices-ws';

import { ChartWallControls } from '../../components/stock/chartwall/ChartWallControls';
import { ChartWallTabs } from '../../components/stock/chartwall/ChartWallTabs';
import { ChartGrid } from '../../components/stock/chartwall/ChartGrid';

import { buildChartWallQueryString, readChartWallQuery } from '../../utils/stock/chartwallUrl';
import type { Latest, PerTab, RotateSec } from '../../types/stock/chart.type';
import { isDefined } from '../../utils/stock/filter';

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatLoadedDay(day: string, timezone: string) {
  if (!day) return '—';
  // day is "yyyy-LL-dd"
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: timezone });
}

export default function ChartWall() {
  // --- in-memory stores ---
  const seriesRef = useRef(new Map<string, { t: number[]; v: number[] }>());
  const latestRef = useRef(new Map<string, Latest>());
  const subsRef = useRef(new Map<string, Set<(p: Latest) => void>>());
  const seriesSubsRef = useRef(new Map<string, Set<() => void>>());
  const inFlightRef = useRef(new Set<string>());
  const tickerCacheRef = useRef(new Map<string, TickerDTO[]>());

  const loadedDayRef = useRef<string>('');
  const loadedTzRef = useRef<string>('');

  const [hydrated, setHydrated] = useState(false);

  // --- ui state ---
  const [allTickers, setAllTickers] = useState<TickerDTO[]>([]);
  const [loadingTickers, setLoadingTickers] = useState(false);

  const [market, setMarket] = useState<Market>('canada');
  const [stockClass, setStockClass] = useState<StockClass>('trade');
  const [buckets, setBuckets] = useState<Bucket[]>(['core']);

  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [perTab, setPerTab] = useState<PerTab>(2);

  const [rotateSec, setRotateSec] = useState<RotateSec>(10);
  const [rotateOn, setRotateOn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  const [loadedDay, setLoadedDay] = useState('');
  const [loadedTz, setLoadedTz] = useState('');

  const [wsConnected, setWsConnected] = useState(false);

  // ---- read URL on mount ----
  useEffect(() => {
    const initial = readChartWallQuery({
      market: 'canada',
      stockClass: 'trade',
      buckets: ['core'],
      symbols: [],
      perTab: 2,
      rotateSec: 10,
      rotateOn: false,
      tab: 0,
    });

    setMarket(initial.market);
    setStockClass(initial.stockClass);
    setBuckets(initial.buckets);
    setSelectedSymbols(initial.symbols);
    setPerTab(initial.perTab);
    setRotateSec(initial.rotateSec);
    setRotateOn(initial.rotateOn);
    setActiveTab(initial.tab);

    // IMPORTANT: delay hydration flag so the writer effect
    // can't run in the same effect flush with stale state
    const id = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  // ---- sync URL on changes ----
  useEffect(() => {
    if (!hydrated) return;

    const qs = buildChartWallQueryString({
      market,
      stockClass,
      buckets,
      symbols: selectedSymbols,
      perTab,
      rotateSec,
      rotateOn,
      tab: activeTab,
    });

    const current = window.location.search.replace(/^\?/, '');
    if (current === qs) return; // idempotent under StrictMode

    window.history.replaceState(null, '', `${window.location.pathname}?${qs}`);

  }, [hydrated, market, stockClass, buckets, selectedSymbols, perTab, rotateSec, rotateOn, activeTab]);

  // ---- load tickers list for dropdown ----
  useEffect(() => {
    const key = `${market}|${stockClass}`;
    const cached = tickerCacheRef.current.get(key);
    if (cached) { setAllTickers(cached); return; }

    let alive = true;
    setLoadingTickers(true);

    listTickers({ market, stockClass })
      .then((data: TickerDTO[]) => {
        if (!alive) return;
        tickerCacheRef.current.set(key, data);
        setAllTickers(data);
      })
      .finally(() => {
        if (!alive) return;
        setLoadingTickers(false);
      });

    return () => {
      alive = false;
    };
  }, [market, stockClass]);

  // ---- connect WS once ----
  useEffect(() => {
    const ws = connectPricesWs({
      onStatus: (s) => setWsConnected(s.connected),
      onPriceUpdate: (u: PriceUpdateDTO) => {
        const price = u.last ?? u.bid ?? u.ask;
        if (price == null) return;

        const payload: Latest = { price, time: u.tradeDatetime };
        latestRef.current.set(u.symbol, payload);

        const set = subsRef.current.get(u.symbol);
        if (set) for (const cb of set) cb(payload);
      },
    });

    return () => ws.close();
  }, []);

  // ---- helpers passed down to ChartGrid/ChartTileUPlot ----
  const getSeries = useCallback((symbol: string) => seriesRef.current.get(symbol), []);

  const subscribeLatest = useCallback((symbol: string, cb: (p: Latest) => void) => {
    let set = subsRef.current.get(symbol);
    if (!set) {
      set = new Set();
      subsRef.current.set(symbol, set);
    }
    set.add(cb);

    const existing = latestRef.current.get(symbol);
    if (existing) cb(existing);

    return () => {
      const s = subsRef.current.get(symbol);
      if (!s) return;
      s.delete(cb);
      if (s.size === 0) subsRef.current.delete(symbol);
    };
  }, []);

  const subscribeSeries = useCallback((symbol: string, cb: () => void) => {
    let set = seriesSubsRef.current.get(symbol);
    if (!set) {
      set = new Set();
      seriesSubsRef.current.set(symbol, set);
    }
    set.add(cb);
    return () => {
      const s = seriesSubsRef.current.get(symbol);
      if (!s) return;
      s.delete(cb);
      if (s.size === 0) seriesSubsRef.current.delete(symbol);
    };
  }, []);

  const toOption = (t: TickerDTO): TickerOption => ({
    id: t.id,
    symbol: t.symbol,
    companyName: t.companyName,
    bucket: t.bucket,
  });

  // ---- filtering for dropdown ----
  const filteredTickers = useMemo(() => {
    return allTickers.filter((t) => {
      if (t.market !== market) return false;
      if (!t.stockClasses?.includes(stockClass as any)) return false;
      if (!buckets.includes(t.bucket)) return false;
      return true;
    })
      .map(toOption);
  }, [allTickers, market, stockClass, buckets]);

  useEffect(() => {
    // Don't prune until we've actually loaded tickers for this market/class
    if (!hydrated) return;
    if (loadingTickers) return;
    if (allTickers.length === 0) return;

    // If filters currently yield zero options, don't nuke the URL selections
    // (could be transient while user is switching filters)
    if (filteredTickers.length === 0) return;

    const allowed = new Set(filteredTickers.map(t => t.symbol));
    setSelectedSymbols(prev => prev.filter(sym => allowed.has(sym)));
  }, [hydrated, loadingTickers, allTickers.length, filteredTickers]);

  // Selecting tickers
  const selectedTickers = useMemo(() => {
    const bySym = new Map(allTickers.map(t => [t.symbol, t]));
    return selectedSymbols.map(s => bySym.get(s)).filter(isDefined).map(toOption);
  }, [selectedSymbols, allTickers]);

  const onSelectedTickers = (tickers: TickerOption[]) => {
    setSelectedSymbols(tickers.map(t => t.symbol));
  };

  // ---- tabs / visible symbols ----
  const tabs = useMemo(() => chunk(selectedSymbols, perTab), [selectedSymbols, perTab]);
  const visibleSymbols = tabs[activeTab] ?? [];

  // keep activeTab in range
  useEffect(() => {
    if (tabs.length === 0) {
      setActiveTab(0);
      return;
    }
    setActiveTab((t) => clamp(t, 0, tabs.length - 1));
  }, [tabs.length]);

  // auto rotation
  useEffect(() => {
    if (!rotateOn) return;
    if (rotateSec <= 0) return;
    if (tabs.length <= 1) return;

    const id = window.setInterval(() => {
      setActiveTab((t) => (t + 1) % tabs.length);
    }, rotateSec * 1000);

    return () => window.clearInterval(id);
  }, [rotateOn, rotateSec, tabs.length]);

  // ---- market change: clear cached series/day ----
  useEffect(() => {
    if (!hydrated) return; // don’t clear during initial URL load

    seriesRef.current.clear();
    inFlightRef.current.clear();
    loadedDayRef.current = '';
    loadedTzRef.current = '';
  }, [market]);

  // ---- fetch missing series ----
  const fetchMissing = useCallback(
    async (symbolsToEnsure: string[]) => {
      const missing = symbolsToEnsure.filter(
        (s) => !seriesRef.current.has(s) && !inFlightRef.current.has(s),
      );
      if (!missing.length) return;

      for (const s of missing) inFlightRef.current.add(s);

      try {
        const res = await fetchChartSeries({ market, symbols: missing, field: 'last' });

        setLoadedDay(res.day);
        setLoadedTz(res.timezone);

        for (const s of res.series) {
          seriesRef.current.set(s.symbol, { t: s.t, v: s.v });

          const subs = seriesSubsRef.current.get(s.symbol);
          if (subs) subs.forEach(fn => fn());
        }
      } finally {
        for (const s of missing) inFlightRef.current.delete(s);
      }
    },
    [market],
  );

  // fetch visible first
  useEffect(() => {
    if (!visibleSymbols.length) return;
    fetchMissing(visibleSymbols);
  }, [visibleSymbols, fetchMissing]);

  // fetch rest lazily
  useEffect(() => {
    if (!selectedSymbols.length) return;
    const id = window.setTimeout(() => fetchMissing(selectedSymbols), 250);
    return () => window.clearTimeout(id);
  }, [selectedSymbols, fetchMissing]);

  return (
    <StockShell>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Stock Wall
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          WS: {wsConnected ? 'connected' : 'disconnected'}
        </Typography>
      </Box>

      <ChartWallControls
        market={market}
        onMarket={setMarket}
        stockClass={stockClass}
        onStockClass={setStockClass}
        buckets={buckets}
        onBuckets={setBuckets}
        perTab={perTab}
        onPerTab={setPerTab}
        rotateOn={rotateOn}
        onRotateOn={setRotateOn}
        rotateSec={rotateSec}
        onRotateSec={setRotateSec}
        filteredTickers={filteredTickers}
        selectedTickers={selectedTickers}
        onSelectedTickers={onSelectedTickers}
        loadingTickers={loadingTickers}
      />

      <Typography variant="body2" sx={{ opacity: 0.85, mb: 1 }}>
        Loaded day: <b>{formatLoadedDay(loadedDay, loadedTz || 'UTC')}</b>
        {loadedTz ? ` (${loadedTz})` : ''}
      </Typography>

      <ChartWallTabs count={tabs.length} active={activeTab} onChange={setActiveTab} />

      <ChartGrid
        symbols={visibleSymbols}
        perTab={perTab}
        loadedDay={loadedDay}
        loadedTz={loadedTz || 'America/Toronto'}
        getSeries={getSeries}
        subscribeLatest={subscribeLatest}
        subscribeSeries={subscribeSeries}
      />
    </StockShell>
  );
}
