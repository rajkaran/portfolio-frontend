import { Autocomplete, Box, Checkbox, Chip, TextField, Typography } from '@mui/material';
import type { TickerDTO, Bucket } from '../../../types/stock/ticker.types';

function bucketLabel(b?: Bucket | string) {
  if (!b) return '—';
  // keep it short + consistent
  if (b === 'longTerm') return 'Long'; // (in case something odd slips in)
  return String(b);
}

export function TickerAutosuggest(props: {
  tickers: TickerDTO[];
  value: TickerDTO[];
  onChange: (next: TickerDTO[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { tickers, value, onChange, label = 'Tickers', placeholder = 'Type symbol or company name', disabled } = props;

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={tickers}
      value={value}
      onChange={(_, v) => onChange(v)}
      disabled={disabled}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionLabel={(opt) => opt.symbol} // chips show ONLY symbol
      filterOptions={(options, state) => {
        const q = state.inputValue.trim().toUpperCase();
        if (!q) return options;
        return options.filter(o =>
          o.symbol.toUpperCase().includes(q) ||
          (o.companyName ?? '').toUpperCase().includes(q)
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={label}
          placeholder={placeholder}
        />
      )}
      renderOption={(optionProps, opt, { selected }) => (
        <Box
          component="li"
          {...optionProps}
          key={opt.id}
          sx={{
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            width: '100%',
          }}
        >
          <Checkbox checked={selected} sx={{ p: 0.5 }} />

          {/* left: symbol + company */}
          <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
              {opt.symbol}
            </Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
              {opt.companyName ?? '—'}
            </Typography>
          </Box>

          {/* right: bucket badge */}
          <Box sx={{ ml: 'auto', pr: 0.5 }}>
            {!!opt.bucket && (
              <Chip
                size="small"
                variant="outlined"
                label={bucketLabel(opt.bucket)}
                sx={{
                  height: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            )}
          </Box>
        </Box>
      )}
    />
  );
}
