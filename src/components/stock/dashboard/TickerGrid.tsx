import { Box } from '@mui/material';
import type { TickerSnapshot } from '../../../types/stock/ticker.types';
import TickerCard from './TickerCard';

export default function TickerGrid({
  tickers,
  onZoom,
  onTrade,
}: {
  tickers: TickerSnapshot[];
  onZoom: (id: string, anchorEl: HTMLElement | null) => void;
  onTrade: (id: string, side: 'buy' | 'sell') => void;
}) {
  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          // key line: number of columns depends on *available width*
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          alignItems: 'stretch',
        }}
      >
        {tickers.map((t) => (
          <TickerCard key={t.id} ticker={t} onZoom={onZoom} onTrade={onTrade} />
        ))}
      </Box>
    </Box>
  );
}
