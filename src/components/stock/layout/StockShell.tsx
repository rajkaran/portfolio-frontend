import { Box, IconButton, Paper } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

import LeftNavBar from './LeftNavBar';

export default function StockShell({
  children,
  right,
}: {
  children: ReactNode;
  right?: (args: { closeRight: () => void }) => ReactNode;
}) {
  const isSmall = useMediaQuery('(max-width:768px)');

  const [collapsed, setCollapsed] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    if (isSmall) {
      setCollapsed(true);
      setRightOpen(false);
    } else {
      setCollapsed(false);
      setRightOpen(true);
    }
  }, [isSmall]);

  const leftWidth = collapsed ? 72 : 280;

  const hasRight = Boolean(right);
  const rightWidth = 240;
  const showRightPanel = hasRight && rightOpen;

  console.log({ isSmall, rightOpen, showRightPanel });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Left */}
      <Paper
        elevation={2}
        sx={{
          width: leftWidth,
          transition: 'width 200ms ease',
          borderRadius: 0,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <LeftNavBar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      </Paper>

      {/* Center */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          overflow: 'auto',
        }}
      >
        {children}
      </Box>

      {/* Right */}
      {showRightPanel ? (
        <Paper
          elevation={2}
          sx={{
            width: rightWidth,
            borderRadius: 0,
            overflow: 'auto',
            flexShrink: 0,
          }}
        >
          {right?.({ closeRight: () => setRightOpen(false) })}
        </Paper>
      ) : null}

      {/* Floating tab button: ONLY on small screens AND ONLY when panel is hidden */}
      {hasRight && !rightOpen ? (
        <Box
          sx={{
            position: 'fixed',
            right: 0,
            top: 96,
            zIndex: 1300,
          }}
        >
          <IconButton
            onClick={() => setRightOpen((v) => !v)}
            sx={{
              borderRadius: '10px 0 0 10px',
              width: 36,
              height: 64,
              bgcolor: 'rgba(255,255,255,0.92)',
              '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            }}
            aria-label={rightOpen ? 'Hide right panel' : 'Show right panel'}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>
      ) : null}
    </Box>
  );
}
