import { Box } from '@mui/material';
import type { TickerLatestDTO } from '../../../types/stock/ticker.types';
import TickerCard from './TickerCard';
import type { ThresholdKey } from '../../../constants/stockUI';

export default function TickerGrid({
  tickers,
  onZoom,
  onTrade,
  onChangeThreshold,
}: {
  tickers: TickerLatestDTO[];
  onZoom: (id: string, anchorEl: HTMLElement | null) => void;
  onTrade: (id: string, side: 'buy' | 'sell') => void;
  onChangeThreshold: (tickerId: string, key: ThresholdKey, value: number) => void;
}) {
  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          // key line: number of columns depends on *available width*
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          alignItems: 'stretch',
        }}
      >
        {tickers.map((t) => (
          <TickerCard key={t.id} ticker={t} onZoom={onZoom} onTrade={onTrade} onChangeThreshold={onChangeThreshold} />
        ))}
      </Box>
    </Box>
  );
}
