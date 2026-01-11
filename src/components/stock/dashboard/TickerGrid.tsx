import { Box } from '@mui/material';
import type { BrokerId, TickerLatestDTO } from '../../../types/stock/ticker.types';
import TickerCard from './TickerCard';
import type { ThresholdKey } from '../../../constants/stockUI';

export default function TickerGrid({
  tickers,
  brokerLabels,
  onZoom,
  onTrade,
  onChangeThreshold,
  onSelectBroker,
}: {
  tickers: TickerLatestDTO[];
  brokerLabels: Record<BrokerId, string>;
  onZoom: (id: string, anchorEl: HTMLElement | null) => void;
  onTrade: (id: string, side: 'buy' | 'sell') => void;
  onChangeThreshold: (tickerId: string, key: ThresholdKey, value: number) => void;
  onSelectBroker: (symbol: string, broker: BrokerId) => void;
}) {
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
          />
        ))}
      </Box>
    </Box>
  );
}
