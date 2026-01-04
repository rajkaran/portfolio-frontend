import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, Select } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { Bucket } from '../../../types/stock/ticker.types';

export function BucketMultiSelect(props: {
  value: Bucket[];
  onChange: (v: Bucket[]) => void;
  items: { value: Bucket; label: string }[];
  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  sx?: SxProps<Theme>;
}) {
  const { value, onChange, label = 'Bucket', size = 'small', disabled, sx } = props;
  const labelBy = new Map(props.items.map(x => [x.value, x.label]));

  return (
    <FormControl size={size} sx={sx} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as Bucket[])}
        renderValue={(sel) =>
          (sel as Bucket[]).map(b => labelBy.get(b) ?? b).join(', ')
        }
      >
        {props.items.map((b) => (
          <MenuItem key={b.value} value={b.value}>
            <Checkbox checked={value.includes(b.value)} />
            <ListItemText primary={b.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
