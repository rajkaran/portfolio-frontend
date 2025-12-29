import { Box, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import StockShell from '../../components/stock/layout/StockShell';
import FilterBar from '../../components/stock/dashboard/FilterBar';
import RightFavorableBar from '../../components/stock/dashboard/RightFavorableBar';
import TickerGrid from '../../components/stock/dashboard/TickerGrid';

import type { TickerSnapshot } from '../../types/stock/ticker.types';
import { applyFilters, defaultStockFilters } from '../../utils/stock/filter';
import { favorabilityScore } from '../../utils/stock/favorability';
import TickerCardTooltip from '../../components/stock/dashboard/TickerDetailTooltip';


const DUMMY_TICKERS: TickerSnapshot[] = [
  {
    id: '1',
    symbol: 'ENB.TO',
    name: 'Enbridge',
    market: 'canada',
    stockClass: 'dividend',
    category: 'core',
    currentPrice: 65.84,
    avgBookCost: 62.1,
    thresholdGreen: 70,
    thresholdCyan: 67,
    thresholdOrange: 60,
    thresholdRed: 58,
    updateDatetime: Date.now() - 60_000,
  },
  {
    id: '2',
    symbol: 'BCE.TO',
    name: 'BCE',
    market: 'canada',
    stockClass: 'dividend',
    category: 'core',
    currentPrice: 102.03,
    avgBookCost: 98.5,
    thresholdGreen: 107,
    thresholdCyan: 104,
    thresholdOrange: 95,
    thresholdRed: 89,
    updateDatetime: Date.now() - 5 * 60_000,
  },
  {
    id: '3',
    symbol: 'AAPL',
    name: 'Apple',
    market: 'usa',
    stockClass: 'trade',
    category: 'once',
    currentPrice: 245.12,
    avgBookCost: 210.0,
    thresholdGreen: 260,
    thresholdCyan: 248,
    thresholdOrange: 230,
    thresholdRed: 222,
    updateDatetime: Date.now() - 12 * 60_000,
  },
  {
    id: '4',
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    market: 'india',
    stockClass: 'trade',
    category: 'avoid',
    currentPrice: 398.0,
    avgBookCost: 420.0,
    thresholdGreen: 470,
    thresholdCyan: 421,
    thresholdOrange: 380,
    thresholdRed: 360,
    updateDatetime: Date.now() - 2 * 60_000,
  },
  {
    id: '5',
    symbol: 'AEM.TO',
    name: 'Agnico Eagle Mines Limited',
    market: 'canada',
    stockClass: 'trade',
    category: 'core',
    currentPrice: 247.68,
    avgBookCost: 244.96,
    thresholdGreen: 249.26,
    thresholdCyan: 248,
    thresholdOrange: 244.06,
    thresholdRed: 242.50,
    updateDatetime: Date.now() - 2 * 60_000,
  },
  {
    id: '6',
    symbol: 'BB.TO',
    name: 'BlackBerry Limited',
    market: 'canada',
    stockClass: 'trade',
    category: 'core',
    currentPrice: 5.46,
    avgBookCost: 5.36,
    thresholdGreen: 6.10,
    thresholdCyan: 6.01,
    thresholdOrange: 5.26,
    thresholdRed: 4.80,
    updateDatetime: Date.now() - 2 * 60_000,
  },
  {
    id: '7',
    symbol: 'CM.TO',
    name: 'CIBC Bank',
    market: 'canada',
    stockClass: 'dividend',
    category: 'watch',
    currentPrice: 126.61,
    avgBookCost: 69.71,
    thresholdGreen: 128.34,
    thresholdCyan: 127.23,
    thresholdOrange: 123.34,
    thresholdRed: 115.23,
    updateDatetime: Date.now() - 2 * 60_000,
  },
  {
    id: '8',
    symbol: 'CNR.TO',
    name: 'Canadian National Railway Co.',
    market: 'canada',
    stockClass: 'trade',
    category: 'once',
    currentPrice: 134.95,
    avgBookCost: 134.70,
    thresholdGreen: 138.23,
    thresholdCyan: 137.15,
    thresholdOrange: 132.45,
    thresholdRed: 130.23,
    updateDatetime: Date.now() - 2 * 60_000,
  },
  {
    id: '9',
    symbol: 'CSH.UN.TO',
    name: 'Chartwell Retirement Residences',
    market: 'canada',
    stockClass: 'trade',
    category: 'watch',
    currentPrice: 20.03,
    avgBookCost: 20.40,
    thresholdGreen: 21.30,
    thresholdCyan: 21.01,
    thresholdOrange: 19.80,
    thresholdRed: 18.70,
    updateDatetime: Date.now() - 2 * 60_000,
  },
];

export default function Dashboard() {
  const [filters, setFilters] = useState(defaultStockFilters);
  const [zoomTickerId, setZoomTickerId] = useState<string | null>(null);
  const [zoomAnchorEl, setZoomAnchorEl] = useState<HTMLElement | null>(null);


  const visibleTickers = useMemo(() => {
    const filtered = applyFilters(DUMMY_TICKERS, filters);
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

  return (
    <StockShell right={({ closeRight }) => <RightFavorableBar onClose={closeRight} />} >
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 2 }}>
        Dashboard
      </Typography>

      <Box sx={{ bgcolor: 'rgba(255,255,255,0.06)', p: 2, borderRadius: 2 }}>
        <FilterBar value={filters} onChange={setFilters} />
      </Box>

      <TickerGrid tickers={visibleTickers} onZoom={onZoom} onTrade={onTrade} />

      <TickerCardTooltip
        open={Boolean(zoomTickerId)}
        anchorEl={zoomAnchorEl}
        ticker={zoomTicker}
        onClose={closeZoom}
      />

    </StockShell>
  );
}
