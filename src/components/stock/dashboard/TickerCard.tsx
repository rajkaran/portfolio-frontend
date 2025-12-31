import { Box, Card, CardContent, IconButton, Stack, Typography } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SellIcon from '@mui/icons-material/Sell';
import { useRef } from 'react';

import type { TickerDTO, TickerLatestDTO } from '../../../types/stock/ticker.types';
import TimeAgo from '../shared/TimeAgo';
import ThresholdMini from './ThresholdMini';
import { THRESHOLD_COLORS } from '../../../constants/stockUI';

function getBorderStatus(ticker: TickerLatestDTO): {
  color?: string;
  blink?: boolean;
} {
  const p = ticker.lastPrice;

  // "Positive blink" only when avgBookCost exists and > 0
  const blinkAllowed = typeof ticker.avgBookCost === 'number' && ticker.avgBookCost > 0;

  // Priority: strongest condition wins
  if (p >= ticker.thresholdGreen) return { color: THRESHOLD_COLORS.thresholdGreen, blink: blinkAllowed };
  if (p >= ticker.thresholdCyan) return { color: THRESHOLD_COLORS.thresholdCyan, blink: blinkAllowed };
  if (p <= ticker.thresholdRed) return { color: THRESHOLD_COLORS.thresholdRed };
  if (p <= ticker.thresholdOrange) return { color: THRESHOLD_COLORS.thresholdOrange };

  // No alert
  return {};
}


export default function TickerCard({
  ticker,
  onZoom,
  onTrade,
}: {
  ticker: TickerLatestDTO;
  onZoom: (id: string, anchorEl: HTMLElement | null) => void;
  onTrade: (id: string, side: 'buy' | 'sell') => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const border = getBorderStatus(ticker);

  return (
    <Card
      ref={cardRef}
      variant="outlined"
      sx={{
        height: '100%',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: border.color ?? 'divider',

        ...(border.blink
          ? {
            '@keyframes borderPulse': {
              '0%': { boxShadow: `0 0 0 0 ${border.color}00` },
              '50%': { boxShadow: `0 0 0 3px ${border.color}55` },
              '100%': { boxShadow: `0 0 0 0 ${border.color}00` },
            },
            animation: 'borderPulse 1.1s ease-in-out infinite',
          }
          : null),
      }}
    >
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
            currentPrice={ticker.lastPrice}
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

        <Box
          sx={{
            mx: 1,
            mt: 0,
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
          }}
        >
          {/* Left: Avg book cost */}
          <Box sx={{ justifySelf: 'start' }}>
            {typeof ticker.avgBookCost === 'number' ? (
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem', lineHeight: 1 }}>
                Avg {ticker.avgBookCost.toFixed(2)}
              </Typography>
            ) : null}
          </Box>

          {/* Center: Profit */}
          <Box sx={{ justifySelf: 'center' }}>
            {typeof ticker.totalReturn === 'number' ? (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  lineHeight: 1,
                  fontWeight: 800,
                  color:
                    ticker.totalReturn > 0
                      ? 'success.main'
                      : ticker.totalReturn < 0
                        ? 'error.main'
                        : 'text.primary',
                }}
              >
                {ticker.totalReturn.toFixed(2)}
              </Typography>
            ) : null}
          </Box>

          {/* Right: TimeAgo */}
          <Box sx={{ justifySelf: 'end' }}>
            {/* do the subtraction to get seconds */}
            {/* <TimeAgo updatedAt={ticker.updateDatetime} /> */}
          </Box>
        </Box>

      </CardContent>
    </Card>
  );
}
