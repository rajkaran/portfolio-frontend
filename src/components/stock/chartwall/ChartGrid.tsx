import { Box } from '@mui/material';
import { ChartTileUPlot } from './ChartTileUPlot';
import type { PerTab } from '../../../types/stock/chart.type';

export function ChartGrid(props: {
  symbols: string[];
  perTab: PerTab;
  getSeries: (symbol: string) => { t: number[]; v: number[] } | undefined;
  subscribeLatest: (symbol: string, cb: (p: { price: number; time: string }) => void) => () => void;
  subscribeSeries: (symbol: string, cb: () => void) => () => void;
}) {
  const gridSpec = (() => {
    if (props.perTab === 1) return { rows: 1, cols: 1 };
    if (props.perTab === 2) return { rows: 1, cols: 2 };
    if (props.perTab === 4) return { rows: 2, cols: 2 };
    if (props.perTab === 6) return { rows: 2, cols: 3 };
    return { rows: 3, cols: 3 };
  })();

  return (
    <Box
      sx={{
        height: 'calc(100vh - 320px)',
        minHeight: 360,
        display: 'grid',
        gap: 2,
        gridTemplateColumns: `repeat(${gridSpec.cols}, 1fr)`,
        gridTemplateRows: `repeat(${gridSpec.rows}, 1fr)`,
      }}
    >
      {props.symbols.map((sym) => (
        <Box
          key={sym}
          sx={{
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChartTileUPlot
            symbol={sym}
            getSeries={props.getSeries}
            subscribeLatest={props.subscribeLatest}
            subscribeSeries={props.subscribeSeries}
          />
        </Box>
      ))}
    </Box>
  );
}
