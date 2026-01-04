import { Box, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText } from '@mui/material';
import type { Market, StockClass, Bucket, TickerDTO } from '../../../types/stock/ticker.types';
import { TickerAutosuggest } from '../shared/TickerAutosuggest';
import type { PerTab, RotateSec } from '../../../types/stock/chart.type';
import { SegmentedToggleButton } from '../../common/SegmentedToggleButton';

export function ChartWallControls(props: {
  market: Market;
  onMarket: (v: Market) => void;

  stockClass: StockClass;
  onStockClass: (v: StockClass) => void;

  buckets: Bucket[];
  onBuckets: (v: Bucket[]) => void;

  perTab: PerTab;
  onPerTab: (v: PerTab) => void;

  rotateOn: boolean;
  onRotateOn: (v: boolean) => void;

  rotateSec: RotateSec;
  onRotateSec: (v: RotateSec) => void;

  filteredTickers: TickerDTO[];
  selectedTickers: TickerDTO[];
  onSelectedTickers: (v: TickerDTO[]) => void;

  loadingTickers?: boolean;
}) {
  const {
    market, onMarket,
    stockClass, onStockClass,
    buckets, onBuckets,
    perTab, onPerTab,
    rotateOn, onRotateOn,
    rotateSec, onRotateSec,
    filteredTickers,
    selectedTickers,
    onSelectedTickers,
    loadingTickers,
  } = props;

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(12, 1fr)', mb: 1 }}>
      <FormControl size="small" sx={{ gridColumn: { xs: 'span 6', md: 'span 4', lg: 'span 2' } }}>
        <InputLabel>Market</InputLabel>
        <Select label="Market" value={market} onChange={(e) => onMarket(e.target.value as Market)}>
          <MenuItem value="canada">Canada</MenuItem>
          <MenuItem value="usa">USA</MenuItem>
          <MenuItem value="india">India</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ gridColumn: { xs: 'span 6', md: 'span 4', lg: 'span 2' } }}>
        <InputLabel>Class</InputLabel>
        <Select label="Class" value={stockClass} onChange={(e) => onStockClass(e.target.value as any)}>
          <MenuItem value="dividend">Dividend</MenuItem>
          <MenuItem value="trade">Trade</MenuItem>
          <MenuItem value="longTerm">Long Term</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ gridColumn: { xs: 'span 6', md: 'span 4', lg: 'span 2' } }}>
        <InputLabel>Bucket</InputLabel>
        <Select
          multiple
          label="Bucket"
          value={buckets}
          onChange={(e) => onBuckets(e.target.value as Bucket[])}
          renderValue={(sel) => sel.join(', ')}
        >
          {(['core', 'watch', 'once', 'avoid'] as Bucket[]).map((b) => (
            <MenuItem key={b} value={b}>
              <Checkbox checked={buckets.includes(b)} />
              <ListItemText primary={b} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ gridColumn: { xs: 'span 6', md: 'span 4', lg: 'span 1' } }}>
        <InputLabel>Charts / Tab</InputLabel>
        <Select label="Charts / Tab" value={perTab} onChange={(e) => onPerTab(Number(e.target.value) as any)}>
          {[1, 2, 4, 6, 9].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
        </Select>
      </FormControl>

      <Box sx={{ gridColumn: { xs: 'span 6', md: 'span 4', lg: 'span 3' }, display: 'flex', gap: 1, alignItems: 'center' }}>
        <SegmentedToggleButton
          value={rotateOn ? 'on' : 'off'}
          onChange={(v) => onRotateOn(v === 'on')}
          options={[
            { value: 'off', label: 'Rotate off' },
            { value: 'on', label: 'Rotate on' },
          ]}
          size="medium"
        />
      </Box>

      <FormControl size="small" sx={{ gridColumn: { xs: 'span 6', md: 'span 4', lg: 'span 2' } }}>
        <InputLabel>Rotate (sec)</InputLabel>
        <Select
          label="Rotate (sec)"
          value={rotateSec}
          onChange={(e) => onRotateSec(Number(e.target.value) as any)}
          disabled={!rotateOn}
        >
          {[10, 20, 30, 40, 50].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
        </Select>
      </FormControl>

      <Box sx={{ gridColumn: 'span 12' }}>
        <TickerAutosuggest
          tickers={filteredTickers}
          value={selectedTickers}
          onChange={onSelectedTickers}
          disabled={loadingTickers}
          label="Tickers"
          placeholder="Type symbol or company name"
        />
      </Box>
    </Box>
  );
}
