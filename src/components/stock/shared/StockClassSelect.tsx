import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { StockClass } from '../../../types/stock/ticker.types';

export function StockClassSelect(props: {
  value: StockClass;
  onChange: (v: StockClass) => void;
  items: { value: StockClass; label: string }[];
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
        {props.items.map((m) => (
          <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
