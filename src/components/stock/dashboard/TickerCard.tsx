import { Box, Card, CardContent, IconButton, Stack, Typography } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SellIcon from '@mui/icons-material/Sell';
import { useRef } from 'react';

import type { TickerSnapshot } from '../../../types/stock/ticker.types';
import TimeAgo from '../shared/TimeAgo';
import ThresholdMini from './ThresholdMini';

export default function TickerCard({
  ticker,
  onZoom,
  onTrade,
}: {
  ticker: TickerSnapshot;
  onZoom: (id: string, anchorEl: HTMLElement | null) => void;
  onTrade: (id: string, side: 'buy' | 'sell') => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  return (
    <Card ref={cardRef} variant="outlined" sx={{ height: '100%' }}>
      <CardContent
        sx={{
          p: 0,            // 8px on all sides
          '&:last-child': {
            pb: 0.3,         // override MUI's extra bottom padding
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mx: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {ticker.symbol}
          </Typography>

          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() => onZoom(ticker.id, cardRef.current)}
              aria-label="Zoom"
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => onTrade(ticker.id, 'buy')}
              aria-label="Buy"
            >
              <ShoppingCartIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => onTrade(ticker.id, 'sell')}
              aria-label="Sell"
            >
              <SellIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>



        {/* Placeholder for your threshold-line visual */}
        <Box sx={{ mt: .5 }}>
          <ThresholdMini
            currentPrice={ticker.currentPrice}
            thresholds={[
              { key: 'thresholdGreen', value: ticker.thresholdGreen },
              { key: 'thresholdCyan', value: ticker.thresholdCyan },
              { key: 'thresholdOrange', value: ticker.thresholdOrange },
              { key: 'thresholdRed', value: ticker.thresholdRed },
            ]}
            height={120}
            onChangeThreshold={(key, value) => { console.log('change threshold', key, value) }}
          />
        </Box>

        <Box sx={{ mx: 1, mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
          <TimeAgo updatedAt={ticker.updateDatetime} />
        </Box>
      </CardContent>
    </Card>
  );
}
