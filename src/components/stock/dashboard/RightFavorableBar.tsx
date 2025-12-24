import { Box, Divider, IconButton, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function RightFavorableBar({ onClose }: { onClose: () => void }) {
  return (
    <Box sx={{ p: 1.5 }}>
      {/* Header row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 40px',
          alignItems: 'center',
          mb: 1,
        }}
      >
        {/* Left: hide button */}
        <IconButton size="small" onClick={onClose} aria-label="Hide favorable panel">
          <ChevronRightIcon />
        </IconButton>

        {/* Center: title */}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, textAlign: 'center' }}>
          Favorable Stocks
        </Typography>

        {/* Right: empty spacer to keep title perfectly centered */}
        <Box />
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Placeholder body */}
      <Typography variant="body2" sx={{ opacity: 0.8 }}>
        This will show “best opportunities” later.
      </Typography>
    </Box>
  );
}
