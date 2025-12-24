import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { TickerSnapshot } from '../../../types/stock/ticker.types';
import TimeAgo from '../shared/TimeAgo';

export default function TickerCard({
  ticker,
  onZoom,
  onTrade,
}: {
  ticker: TickerSnapshot;
  onZoom: (id: string) => void;
  onTrade: (id: string, side: 'buy' | 'sell') => void;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {ticker.symbol}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {ticker.name}
            </Typography>
          </Box>

          <Chip size="small" label={ticker.category} />
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt: 1.5 }} alignItems="baseline">
          <Typography variant="h6">${ticker.currentPrice.toFixed(2)}</Typography>
          {typeof ticker.avgBookCost === 'number' ? (
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              Avg cost: ${ticker.avgBookCost.toFixed(2)}
            </Typography>
          ) : null}
        </Stack>

        {/* Placeholder for your threshold-line visual */}
        <Box
          sx={{
            mt: 1.5,
            height: 88,
            borderRadius: 1,
            bgcolor: 'rgba(0,0,0,0.04)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.6,
              fontSize: 12,
            }}
          >
            Threshold lines area (next)
          </Box>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button size="small" variant="outlined" onClick={() => onZoom(ticker.id)}>
            Zoom
          </Button>
          <Button size="small" variant="contained" onClick={() => onTrade(ticker.id, 'buy')}>
            Buy
          </Button>
          <Button size="small" color="warning" variant="contained" onClick={() => onTrade(ticker.id, 'sell')}>
            Sell
          </Button>
        </Stack>

        <Box sx={{ mt: 1.25 }}>
          <TimeAgo updatedAt={ticker.updateDatetime} />
        </Box>
      </CardContent>
    </Card>
  );
}
