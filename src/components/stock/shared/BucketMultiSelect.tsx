import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, Select } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { Bucket } from '../../../types/stock/ticker.types';

const BUCKETS: Bucket[] = ['core', 'watch', 'once', 'avoid'];

export function BucketMultiSelect(props: {
  value: Bucket[];
  onChange: (v: Bucket[]) => void;
  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  sx?: SxProps<Theme>;
}) {
  const { value, onChange, label = 'Bucket', size = 'small', disabled, sx } = props;

  return (
    <FormControl size={size} sx={sx} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as Bucket[])}
        renderValue={(sel) => (sel as Bucket[]).join(', ')}
      >
        {BUCKETS.map((b) => (
          <MenuItem key={b} value={b}>
            <Checkbox checked={value.includes(b)} />
            <ListItemText primary={b} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
