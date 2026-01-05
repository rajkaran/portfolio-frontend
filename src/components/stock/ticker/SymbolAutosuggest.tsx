import { Autocomplete, Box, CircularProgress, TextField, Typography } from '@mui/material';
import type { SymbolSuggestDTO } from '../../../types/stock/ticker.types';

export function SymbolAutosuggest(props: {
  value: SymbolSuggestDTO | null;
  onChange: (next: SymbolSuggestDTO | null) => void;

  inputValue: string;
  onInputChange: (next: string) => void;

  options: SymbolSuggestDTO[];
  loading?: boolean;

  label?: string;
  placeholder?: string;
  disabled?: boolean;

  showLastPrice?: boolean; // default true
}) {
  const {
    value,
    onChange,
    inputValue,
    onInputChange,
    options,
    loading = false,
    label = 'Symbol',
    placeholder = 'Type a symbol (e.g., ENB)',
    disabled,
    showLastPrice = true,
  } = props;

  return (
    <Autocomplete
      multiple={false}
      options={options}
      value={value}
      onChange={(_, v) => onChange(v)}
      inputValue={inputValue}
      onInputChange={(_, v) => onInputChange(v)}
      disabled={disabled}
      loading={loading}
      isOptionEqualToValue={(a, b) => a.symbolId === b.symbolId}
      getOptionLabel={(opt) => opt.symbol}
      // IMPORTANT: server already filters by prefix; don't do client filtering
      filterOptions={(x) => x}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(optionProps, opt) => (
        <Box
          component="li"
          {...optionProps}
          key={opt.symbolId}
          sx={{
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            width: '100%',
          }}
        >
          {/* left: symbol + description */}
          <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
              {opt.symbol}
            </Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
              {opt.description ?? '—'}
            </Typography>
          </Box>

          {/* right: last price */}
          {showLastPrice && (
            <Box sx={{ ml: 'auto', pr: 0.5, textAlign: 'right' }}>
              <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500, fontSize: 14, lineHeight: 1 }}>
                ${opt.lastPrice != null ? opt.lastPrice.toFixed(2) : '—'}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    />
  );
}
