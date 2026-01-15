import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { Market } from '../../../types/stock/ticker.types';

export function MarketSelect(props: {
  value: Market;
  onChange: (v: Market) => void;
  items: { value: Market; label: string }[];
  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  sx?: SxProps<Theme>;
}) {
  const { value, onChange, label = 'Market', size = 'small', disabled, sx } = props;

  return (
    <FormControl size={size} sx={sx} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e) => onChange(e.target.value as Market)}>
        {props.items.map((m) => (
          <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
