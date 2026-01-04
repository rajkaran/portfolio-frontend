import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { Bucket } from '../../../types/stock/ticker.types';

const DEFAULT_ITEMS: { value: Bucket; label: string }[] = [
  { value: 'core', label: 'Core' },
  { value: 'watch', label: 'Watch' },
  { value: 'once', label: 'Once' },
  { value: 'avoid', label: 'Avoid' },
];

export function BucketSelect(props: {
  value: Bucket;
  onChange: (v: Bucket) => void;
  items: { value: Bucket; label: string }[];
  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  sx?: SxProps<Theme>;
}) {
  const { value, onChange, items, label = 'Bucket', size = 'small', disabled, sx } = props;
  const list = items?.length ? items : DEFAULT_ITEMS;

  return (
    <FormControl size={size} sx={sx} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e) => onChange(e.target.value as Bucket)}>
        {list.map((b) => (
          <MenuItem key={b.value} value={b.value}>
            {b.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
