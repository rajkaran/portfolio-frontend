import { Box, Typography } from '@mui/material';
import StockShell from '../../components/stock/layout/StockShell';

export default function Setting() {
  return (
    <StockShell>
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 2 }}>
        Settings
      </Typography>

      <Box sx={{ bgcolor: 'rgba(255,255,255,0.06)', p: 2, borderRadius: 2 }}>
        Settings page content goes here.
      </Box>
    </StockShell>
  );
}
