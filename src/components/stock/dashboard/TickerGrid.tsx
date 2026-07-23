import { Box } from '@mui/material';
import type { TickerLatestDTO } from '../../../types/stock/ticker.types';
import TickerCard from './TickerCard';
import type { ThresholdKey } from '../../../constants/stockUI';

export default function TickerGrid({
  tickers,
  brokerLabels,
  onZoom,
  onTrade,
  onChangeThreshold,
  onSelectBroker,
  silencedById,
  onToggleSilence,
}: {
  tickers: TickerLatestDTO[];
  brokerLabels: Record<string, string>;
  onZoom: (id: string, anchorEl: HTMLElement | null) => void;
  onTrade: (id: string, side: 'buy' | 'sell') => void;
  onChangeThreshold: (tickerId: string, key: ThresholdKey, value: number) => void;
  onSelectBroker: (symbol: string, brokerAccountId: string) => void;
  silencedById: Record<string, boolean>;
  onToggleSilence: (tickerId: string) => void;
}) {
  console.log('Rendering TickerGrid with broker labels:', brokerLabels);
  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          // key line: number of columns depends on *available width*
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          alignItems: 'stretch',
        }}
      >
        {tickers.map((t) => (
          <TickerCard
            key={t.id}
            ticker={t}
            brokerLabels={brokerLabels}
            onZoom={onZoom}
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
