import { Box, IconButton, Paper } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

import LeftNavBar from './LeftNavBar';

const LEFT_RAIL_WIDTH = 72;
const LEFT_DRAWER_WIDTH = 280;
const RIGHT_WIDTH = 240;

export default function StockShell({
  children,
  right,
}: {
  children: ReactNode;
  right?: (args: { closeRight: () => void }) => ReactNode;
}) {
  const isSmall = useMediaQuery('(max-width:768px)');
  const hasRight = Boolean(right);

  // Left “mini vs expanded” (single sidebar that animates width)
  const [leftExpanded, setLeftExpanded] = useState(false);

  // Right panel open/close
  const [rightOpen, setRightOpen] = useState(false);

  // start closed on page load / breakpoint change
  useEffect(() => {
    setLeftExpanded(false);
    setRightOpen(false);
  }, [isSmall]);

  // Mobile rule: only one overlay open at a time
  const toggleLeft = () => {
    setLeftExpanded((v) => {
      const next = !v;
      if (isSmall && next) setRightOpen(false);
      return next;
    });
  };

  const closeRight = () => setRightOpen(false);

  const toggleRight = () => {
    if (!hasRight) return;
    setRightOpen((v) => {
      const next = !v;
      if (isSmall && next) setLeftExpanded(false);
      return next;
    });
  };

  // Right overlays on mobile, pushes on desktop
  const showRightAsOverlay = isSmall;

  // Left width animates smoothly
  const leftWidth = leftExpanded ? LEFT_DRAWER_WIDTH : LEFT_RAIL_WIDTH;

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* LEFT: single sidebar (fixed) that animates width */}
      <Paper
        elevation={leftExpanded ? 6 : 2}
        sx={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: leftWidth,
          borderRadius: 0,
          overflow: 'hidden',
          zIndex: leftExpanded ? 1400 : 1200,
          transition: 'width 220ms ease',
        }}
      >
        <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
          <LeftNavBar collapsed={!leftExpanded} onToggleCollapse={toggleLeft} />
        </Box>
      </Paper>

      {/* Layout row: reserve ONLY the rail width so content never jumps */}
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Spacer for the rail (always 72px) */}
        <Box sx={{ width: LEFT_RAIL_WIDTH, flexShrink: 0 }} />

        {/* Center */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            height: '100vh',
            overflowY: 'auto',
            p: 2,
          }}
        >
          {children}
        </Box>

        {/* Right panel (desktop push) */}
        {hasRight && rightOpen && !showRightAsOverlay ? (
          <Paper
            elevation={2}
            sx={{
              width: RIGHT_WIDTH,
              height: '100vh',
              borderRadius: 0,
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            {right?.({ closeRight })}
          </Paper>
        ) : null}
      </Box>

      {/* Right panel overlay (mobile) */}
      {hasRight && rightOpen && showRightAsOverlay ? (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: RIGHT_WIDTH,
            borderRadius: 0,
            overflowY: 'auto',
            zIndex: 1400,
          }}
        >
          {right?.({ closeRight })}
        </Paper>
      ) : null}

      {/* Floating tab button for right (when closed) */}
      {hasRight && !rightOpen ? (
        <Box
          sx={{
            position: 'fixed',
            right: 0,
            top: 96,
            zIndex: 1500,
          }}
        >
          <IconButton
            onClick={toggleRight}
            sx={{
              borderRadius: '10px 0 0 10px',
              width: 36,
              height: 64,
              bgcolor: 'rgba(255,255,255,0.92)',
              '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            }}
            aria-label="Open favorable stocks panel"
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>
      ) : null}
    </Box>
  );
}
