import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { StockClass } from '../../../types/stock/ticker.types';

export function StockClassSelect(props: {
  value: StockClass;
  onChange: (v: StockClass) => void;
  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  sx?: SxProps<Theme>;
}) {
  const { value, onChange, label = 'Class', size = 'small', disabled, sx } = props;

  return (
    <FormControl size={size} sx={sx} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e) => onChange(e.target.value as StockClass)}>
        <MenuItem value="dividend">Dividend</MenuItem>
        <MenuItem value="trade">Trade</MenuItem>
        <MenuItem value="longTerm">Long Term</MenuItem>
      </Select>
    </FormControl>
  );
}
