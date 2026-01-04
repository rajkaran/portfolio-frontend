import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, Select } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { StockClass } from '../../../types/stock/ticker.types';

const DEFAULT_ITEMS: { value: StockClass; label: string }[] = [
  { value: 'dividend', label: 'Dividend' },
  { value: 'trade', label: 'Trade' },
  { value: 'longTerm', label: 'Long Term' },
];

// Normalize MUI Select multiple value (can be string in autofill edge case)
function normalizeMulti(value: unknown): StockClass[] {
  if (Array.isArray(value)) return value as StockClass[];
  if (typeof value === 'string') return value.split(',').map((x) => x.trim()) as StockClass[];
  return [];
}

export function StockClassMultiSelect(props: {
  value: StockClass[];
  onChange: (v: StockClass[]) => void;
  items: { value: StockClass; label: string }[];
  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  sx?: SxProps<Theme>;
}) {
  const { value, onChange, items, label = 'Classes', size = 'small', disabled, sx } = props;

  const list = (items && items.length ? items : DEFAULT_ITEMS);

  // label lookup map
  const labelBy = new Map(list.map((x) => [x.value, x.label]));

  return (
    <FormControl size={size} sx={sx} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        label={label}
        value={value}
        onChange={(e) => onChange(normalizeMulti(e.target.value))}
        renderValue={(selected) =>
          (selected as StockClass[])
            .map((c) => labelBy.get(c) ?? c)
            .join(', ')
        }
      >
        {list.map((c) => (
          <MenuItem key={c.value} value={c.value}>
            <Checkbox checked={value.includes(c.value)} />
            <ListItemText primary={c.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
