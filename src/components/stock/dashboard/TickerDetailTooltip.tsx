import {
  Box,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Paper,
  Popper,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import type { TickerLatestDTO } from '../../../types/stock/ticker.types';

export default function TickerCardTooltip({
  open,
  anchorEl,
  ticker,
  onClose,
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  ticker: TickerLatestDTO | null;
  onClose: () => void;
}) {
  const isSmall = useMediaQuery('(max-width:768px)', { noSsr: true });
  const [arrowEl, setArrowEl] = useState<HTMLDivElement | null>(null);

  const theme = useTheme();
  const paperBg = theme.palette.background.paper;

  // Close on ESC
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const modifiers = useMemo(
    () => [
      { name: 'offset', options: { offset: [0, 10] } }, // gap from anchor
      { name: 'flip', options: { fallbackPlacements: ['left-start', 'right-start', 'bottom-start'] } },
      { name: 'preventOverflow', options: { padding: 12 } },
      { name: 'arrow', options: { element: arrowEl, padding: 14 } },
    ],
    [arrowEl],
  );

  useEffect(() => {
    if (!open || !anchorEl) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        // If the anchor is fully out of view, close the tooltip
        if (!entry.isIntersecting) onClose();
      },
      {
        root: null,        // viewport
        threshold: 0.05,   // treat “barely visible” as visible
      },
    );

    obs.observe(anchorEl);
    return () => obs.disconnect();
  }, [open, anchorEl, onClose]);

  if (!ticker) return null;

  const content = (
    <Box sx={{ width: 340, maxWidth: '90vw' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 40px',
          alignItems: 'center',
          gap: 1,
          p: 1.25,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
            {ticker.symbol}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            {ticker.companyName}
          </Typography>
        </Box>

        <IconButton size="small" onClick={onClose} aria-label="Close zoom">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ p: 1.25 }}>
        <Typography variant="body2">
          Current: <b>${ticker?.lastPrice?.toFixed(2)}</b>
        </Typography>

        <Box
          sx={{
            mt: 1.25,
            height: 140,
            borderRadius: 1,
            bgcolor: 'rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          Intraday chart (later)
        </Box>
      </Box>
    </Box>
  );

  // Mobile: modal
  if (isSmall) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogContent sx={{ p: 0 }}>{content}</DialogContent>
      </Dialog>
    );
  }

  // Desktop: Popper anchored to the CARD
  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="right-start"
      modifiers={modifiers}
      sx={{ zIndex: 1400 }}
    >

      <Box sx={{ position: 'relative' }}>
        {/* Triangle Arrow (position controlled by [data-popper-placement]) */}
        <Box
          ref={setArrowEl}
          data-popper-arrow
          sx={{
            position: 'absolute',
            width: 0,
            height: 0,

            // Default arrow size
            borderStyle: 'solid',

            // When popper is on the RIGHT of anchor, arrow points LEFT
            '[data-popper-placement*="right"] &': {
              left: -10,
              top: 18,
              borderWidth: '8px 10px 8px 0',
              borderColor: `transparent ${paperBg} transparent transparent`,
            },

            // When popper is on the LEFT of anchor, arrow points RIGHT
            '[data-popper-placement*="left"] &': {
              right: -10,
              top: 18,
              borderWidth: '8px 0 8px 10px',
              borderColor: `transparent transparent transparent ${paperBg}`,
            },

            // When popper is BELOW anchor, arrow points UP
            '[data-popper-placement*="bottom"] &': {
              top: -10,
              left: 22,
              borderWidth: '0 8px 10px 8px',
              borderColor: `transparent transparent ${paperBg} transparent`,
            },

            // When popper is ABOVE anchor, arrow points DOWN
            '[data-popper-placement*="top"] &': {
              bottom: -10,
              left: 22,
              borderWidth: '10px 8px 0 8px',
              borderColor: `${paperBg} transparent transparent transparent`,
            },
          }}
        />

        <Paper elevation={10} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {content}
        </Paper>
      </Box>

    </Popper>
  );
}
