import { Autocomplete, Box, TextField, Typography, Chip } from '@mui/material';
import type { TickerOption, Bucket } from '../../../types/stock/ticker.types';

function bucketLabel(b?: Bucket | string) {
  if (!b) return '—';
  if (b === 'longTerm') return 'Long';
  return String(b);
}

export function SingleTickerSelect(props: {
  tickers: TickerOption[];
  value: TickerOption | null;
  onChange: (next: TickerOption | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  showBucket?: boolean;
}) {
  const {
    tickers, value, onChange,
    label = 'Ticker',
    placeholder = 'Type symbol or company name',
    disabled,
    showBucket = true,
  } = props;

  return (
    <Autocomplete
      multiple={false}
      options={tickers}
      value={value}
      onChange={(_, v) => onChange(v)}
      disabled={disabled}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionLabel={(opt) => opt.symbol}
      filterOptions={(options, state) => {
        const q = state.inputValue.trim().toUpperCase();
        if (!q) return options;
        return options.filter(o =>
          o.symbol.toUpperCase().includes(q) ||
          (o.companyName ?? '').toUpperCase().includes(q)
        );
      }}
      renderInput={(params) => (
        <TextField {...params} size="small" label={label} placeholder={placeholder} />
      )}
      renderOption={(optionProps, opt) => (
        <Box
          component="li"
          {...optionProps}
          key={opt.id}
          sx={{ py: 1, display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{opt.symbol}</Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.75 }}>{opt.companyName ?? '—'}</Typography>
          </Box>

          {showBucket && !!opt.bucket && (
            <Box sx={{ ml: 'auto', pr: 0.5 }}>
              <Chip
                size="small"
                variant="outlined"
                label={bucketLabel(opt.bucket)}
                sx={{ height: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', '& .MuiChip-label': { px: 0.75 } }}
              />
            </Box>
          )}
        </Box>
      )}
    />
  );
}
