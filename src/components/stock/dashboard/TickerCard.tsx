import { Box, Card, CardContent, Chip, IconButton, MenuItem, Select, Stack, Typography } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SellIcon from '@mui/icons-material/Sell';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import type { BrokerId, TickerLatestDTO } from '../../../types/stock/ticker.types';
import TimeAgo from '../shared/TimeAgo';
import ThresholdMini from './ThresholdMini';
import { THRESHOLD_COLORS } from '../../../constants/stockUI';
import type { ThresholdKey } from '../../../constants/stockUI';
import { useRef } from 'react';

function brokerQty(ticker: TickerLatestDTO, broker: BrokerId): number {
  const q = ticker.positionsByBroker?.[broker]?.quantityHolding;
  return typeof q === 'number' ? q : 0;
}

function brokerAvg(ticker: TickerLatestDTO, broker: BrokerId): number | null {
  const a = ticker.positionsByBroker?.[broker]?.avgBookCost;
  return typeof a === 'number' ? a : null;
}

function getBorderStatus(ticker: TickerLatestDTO): {
  color?: string;
  blink?: boolean;
} {
  const p = ticker.lastPrice ?? 0;

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


export default function TickerCard(props: {
  ticker: TickerLatestDTO;
  brokerLabels: Record<BrokerId, string>;
  onZoom: (id: string, anchorEl: HTMLElement | null) => void;
  onTrade: (id: string, side: 'buy' | 'sell') => void;
  onChangeThreshold: (tickerId: string, key: ThresholdKey, value: number) => void;
  onSelectBroker: (symbol: string, broker: BrokerId) => void;
  silenced: boolean;
  onToggleSilence: (tickerId: string) => void;
  showZoom?: boolean;
}) {
  const { ticker, brokerLabels, onZoom, onTrade, onChangeThreshold, onSelectBroker, silenced, onToggleSilence, showZoom = true } = props;

  const cardRef = useRef<HTMLDivElement | null>(null);
  const border = getBorderStatus(ticker);

  const FALLBACK_BROKER: BrokerId = 'wealthsimple';

  const eligibleBrokers = (Object.keys(ticker.positionsByBroker ?? {}) as BrokerId[]).filter((b) => brokerQty(ticker, b) > 0);
  const showDropdown = eligibleBrokers.length >= 2;

  const displayBroker: BrokerId =
    (ticker.uiSelectedBroker && eligibleBrokers.includes(ticker.uiSelectedBroker) ? ticker.uiSelectedBroker : undefined) ??
    eligibleBrokers[0] ??
    FALLBACK_BROKER;

  const fmt = (avg: number | null, qty: number) =>
    avg != null ? `Avg ${avg.toFixed(2)} (${qty})` : `Qty (${qty})`;

  const CAPTION_FONT = '0.65rem';

  const leftPositionNode = showDropdown ? (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      <Select
        variant="standard"
        disableUnderline
        value={displayBroker}
        onChange={(e) => onSelectBroker(ticker.symbol, e.target.value as BrokerId)}
        sx={{
          // match the static caption look
          fontSize: CAPTION_FONT,
          lineHeight: 1,
          opacity: 0.8,

          // IMPORTANT: keep it tight like Typography (no forced width)
          width: 'auto',
          display: 'inline-flex',
          alignItems: 'center',

          // remove MUI hover/focus "input" feel
          '&:hover': { backgroundColor: 'transparent' },
          '&.Mui-focused': { backgroundColor: 'transparent' },

          // the actual displayed value
          '& .MuiSelect-select': {
            fontSize: CAPTION_FONT,
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,

            // THIS is the gap you’re fighting: reserve less room for the chevron
            paddingRight: '14px !important',
            minHeight: 'unset',
          },

          // move chevron closer + vertically center it
          '& .MuiSelect-icon': {
            right: 2,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.05rem', // slightly smaller reads better beside caption text
          },
        }}
        renderValue={(value) => {
          const b = value as BrokerId;
          const avg = brokerAvg(ticker, b);
          const qty = brokerQty(ticker, b);
          return fmt(avg, qty); // "Avg 202.71 (10)"
        }}
        MenuProps={{
          PaperProps: { sx: { mt: 0.5 } },
        }}
      >
        {eligibleBrokers.map((b: BrokerId) => {
          const avg = brokerAvg(ticker, b);
          const qty = brokerQty(ticker, b);
          return (
            <MenuItem key={b} value={b}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                  {fmt(avg, qty)}
                </Typography>

                <Chip
                  size="small"
                  label={brokerLabels[b] ?? b}
                  sx={{ height: 18, fontSize: '0.62rem' }}
                />
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </Box>
  ) : (
    <Typography variant="caption" sx={{ opacity: 0.8, fontSize: CAPTION_FONT, lineHeight: 1 }}>
      {typeof ticker.avgBookCost === 'number' ? `Avg ${ticker.avgBookCost.toFixed(2)}` : null}
      {typeof ticker.quantityHolding === 'number' && ticker.quantityHolding > 0 ? ` (${ticker.quantityHolding})` : null}
    </Typography>
  );

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

          <Stack direction="row" spacing={0.1}>
            {showZoom ? (
              <IconButton
                size="small"
                onClick={() => onZoom(ticker.id, cardRef.current)}
                title="Zoom"
                aria-label="Zoom"
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            ) : null}

            <IconButton
              size="small"
              onClick={() => onTrade(ticker.id, 'buy')}
              title="Buy"
              aria-label="Buy"
            >
              <ShoppingCartIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => onTrade(ticker.id, 'sell')}
              title="Sell"
              aria-label="Sell"
            >
              <SellIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => onToggleSilence(ticker.id)}
              title={silenced ? 'Unsilence buy signal' : 'Silence buy signal'}
              aria-label={silenced ? 'Unsilence' : 'Silence'}
            >
              {silenced ? (
                <NotificationsOffIcon fontSize="small" />
              ) : (
                <NotificationsActiveIcon fontSize="small" />
              )}
            </IconButton>
          </Stack>
        </Stack>

        {/* Placeholder for your threshold-line visual */}
        <Box sx={{ mt: .5 }}>
          <ThresholdMini
            currentPrice={ticker.lastPrice ?? 0}
            thresholds={[
              { key: 'thresholdGreen', value: ticker.thresholdGreen },
              { key: 'thresholdCyan', value: ticker.thresholdCyan },
              { key: 'thresholdOrange', value: ticker.thresholdOrange },
              { key: 'thresholdRed', value: ticker.thresholdRed },
            ]}
            height={120}
            onChangeThreshold={(key, value) => onChangeThreshold(ticker.id, key, value)}
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
            {leftPositionNode}
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
            <TimeAgo updatedAtIso={(ticker.tradeDatetime) ?? ''} />
          </Box>
        </Box>

      </CardContent>
    </Card>
  );
}
