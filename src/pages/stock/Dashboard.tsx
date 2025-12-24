import { Box, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import StockShell from '../../components/stock/layout/StockShell';
import FilterBar from '../../components/stock/dashboard/FilterBar';
import RightFavorableBar from '../../components/stock/dashboard/RightFavorableBar';
import TickerGrid from '../../components/stock/dashboard/TickerGrid';

import type { TickerSnapshot } from '../../types/stock/ticker.types';
import { applyFilters, defaultStockFilters } from '../../utils/stock/filter';
import { favorabilityScore } from '../../utils/stock/favorability';

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
    category: 'watch',
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
];

export default function Dashboard() {
  const [filters, setFilters] = useState(defaultStockFilters);

  const visibleTickers = useMemo(() => {
    const filtered = applyFilters(DUMMY_TICKERS, filters);
    // temporary sort logic
    return filtered.sort((a, b) => favorabilityScore(b) - favorabilityScore(a));
  }, [filters]);

  const onZoom = (id: string) => {
    console.log('zoom', id);
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
    </StockShell>
  );
}
