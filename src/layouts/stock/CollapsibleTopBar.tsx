import { Box, Collapse, IconButton, Typography } from '@mui/material';
import { useState, type ReactNode } from 'react';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

const LEFT_RAIL_WIDTH = 72;

export default function CollapsibleTopBar({
  children,
  title,
  onOpenChange,
}: {
  children: ReactNode;
  title?: ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const toggle = (next: boolean)=>{
    setOpen(next);
    onOpenChange?.(next);
  }
  return (
    <>
      {/* Floating tab when collapsed */}
      {!open && (
        <Box sx={{ position: 'fixed', left: LEFT_RAIL_WIDTH+16, top: 0, zIndex: 1500 }}>
          <IconButton
            onClick={() => toggle(true)}
            sx={{
              borderRadius: '0 0 10px 10px',
              width: 48,
              height: 36,
              bgcolor: 'rgba(255,255,255,0.92)',
              '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            }}
            aria-label="Expand filters"
          >
            <ExpandMore />
          </IconButton>
        </Box>
      )}

      {/* Title row with collapse arrow when open */}
      {open && (
        <Collapse in={open}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <IconButton
              size="small"
              onClick={() => toggle(false)}
              aria-label="Collapse filters"
              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <ExpandLess fontSize="small" />
            </IconButton>
            {title && (
              <Typography variant="h5" sx={{ fontWeight: 500, flex: 1 }}>
                {title}
              </Typography>
            )}
          </Box>
          {children}
        </Collapse>
      )}
    </>
  );
}