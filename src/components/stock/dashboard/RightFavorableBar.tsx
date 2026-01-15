import { Box, Divider, IconButton, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import type { BrokerId, TickerLatestDTO } from '../../../types/stock/ticker.types';
import type { ThresholdKey } from '../../../constants/stockUI';
import TickerCard from './TickerCard';

export default function RightFavorableBar({
  onClose,
  tickers,
  brokerLabels,
  onTrade,
  onChangeThreshold,
  onSelectBroker,
  silencedById,
  onToggleSilence,
}: {
  onClose: () => void;
  tickers: TickerLatestDTO[];
  brokerLabels: Record<BrokerId, string>;
  onTrade: (id: string, side: 'buy' | 'sell') => void;
  onChangeThreshold: (tickerId: string, key: ThresholdKey, value: number) => void;
  onSelectBroker: (symbol: string, broker: BrokerId) => void;
  silencedById: Record<string, boolean>;
  onToggleSilence: (tickerId: string) => void;
}) {
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
          Favorable
        </Typography>

        {/* Right: empty spacer to keep title perfectly centered */}
        <Box />
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      <Box sx={{ display: 'grid', gap: 1.25 }}>
        {tickers.map((t) => (
          <TickerCard
            key={t.id}
            ticker={t}
            brokerLabels={brokerLabels}
            onZoom={() => { }}              // unused
            showZoom={false}               // hide it
            onTrade={onTrade}
            onChangeThreshold={onChangeThreshold}
            onSelectBroker={onSelectBroker}
            silenced={!!silencedById[t.id]}
            onToggleSilence={onToggleSilence}
          />
        ))}
      </Box>

    </Box>
  );
}
