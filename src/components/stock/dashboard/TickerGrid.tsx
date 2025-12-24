import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import type { TickerSnapshot } from '../../../types/stock/ticker.types';
import TickerCard from './TickerCard';

export default function TickerGrid({
  tickers,
  onZoom,
  onTrade,
}: {
  tickers: TickerSnapshot[];
  onZoom: (id: string) => void;
  onTrade: (id: string, side: 'buy' | 'sell') => void;
}) {
  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        {tickers.map((t) => (
          <Grid key={t.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <TickerCard ticker={t} onZoom={onZoom} onTrade={onTrade} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
