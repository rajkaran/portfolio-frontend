import { Box, FormControl, InputLabel, Select, MenuItem} from '@mui/material';
import { TickerAutosuggest } from '../shared/TickerAutosuggest';
import type { PerTab, RotateSec } from '../../../types/stock/chart.types';
import { SegmentedToggleButton } from '../../common/SegmentedToggleButton';
import { MarketSelect } from '../shared/MarketSelect';
import { StockClassSelect } from '../shared/StockClassSelect';
import { BucketMultiSelect } from '../shared/BucketMultiSelect';
import type { TickerOption } from '../../../types/stock/ticker.types';
import type { DropdownItem } from '../../../utils/stock/prepareDropdownOptions';

export function ChartWallControls(props: {
  market: string;
  onMarket: (v: string) => void;

  stockClass: string;
  onStockClass: (v: string) => void;

  buckets: string[];
  onBuckets: (v: string[]) => void;

  marketItems: DropdownItem[];
  classItems: DropdownItem[];
  bucketItems: DropdownItem[];

  perTab: PerTab;
  onPerTab: (v: PerTab) => void;

  rotateOn: boolean;
  onRotateOn: (v: boolean) => void;

  rotateSec: RotateSec;
  onRotateSec: (v: RotateSec) => void;

  filteredTickers: TickerOption[];
  selectedTickers: TickerOption[];
  onSelectedTickers: (v: TickerOption[]) => void;

  loadingTickers?: boolean;
  loadingOptions?: boolean;
}) {
  const {
    market,
    onMarket,
    stockClass,
    onStockClass,
    buckets,
    onBuckets,
    marketItems,
    classItems,
    bucketItems,
    perTab,
    onPerTab,
    rotateOn,
    onRotateOn,
    rotateSec,
    onRotateSec,
    filteredTickers,
    selectedTickers,
    onSelectedTickers,
    loadingTickers,
    loadingOptions,
  } = props;

  return (
    
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(12, 1fr)', mb: 1 }}>
          <MarketSelect
            value={market}
            onChange={onMarket}
            items={marketItems}
            disabled={loadingOptions}
            sx={{ gridColumn: { xs: 'span 6', md: 'span 4', lg: 'span 2' } }}
            />

          <StockClassSelect
            value={stockClass}
            onChange={onStockClass}
            items={classItems}
            disabled={loadingOptions}
            sx={{ gridColumn: { xs: 'span 6', md: 'span 4', lg: 'span 2' } }}
            />

          <BucketMultiSelect
            value={buckets}
            onChange={onBuckets}
            items={bucketItems}
            disabled={loadingOptions}
            sx={{ gridColumn: { xs: 'span 6', md: 'span 4', lg: 'span 2' } }}
            />

          <FormControl size="small" sx={{ gridColumn: { xs: 'span 6', md: 'span 4', lg: 'span 1' } }}>
            <InputLabel>Charts / Tab</InputLabel>
            <Select
              label="Charts / Tab"
              value={perTab}
              onChange={(e) => onPerTab(Number(e.target.value) as PerTab)}
              >
              {[1, 2, 4, 6, 9].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box
            sx={{
              gridColumn: { xs: 'span 6', md: 'span 4', lg: 'span 3' },
              display: 'flex',
              gap: 1,
              alignItems: 'center',
            }}
            >
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
              onChange={(e) => onRotateSec(Number(e.target.value) as RotateSec)}
              disabled={!rotateOn}
              >
              {[10, 20, 30, 40, 50].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
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
