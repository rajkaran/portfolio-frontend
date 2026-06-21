import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { DropdownItem } from '../../../utils/stock/prepareDropdownOptions';

export function BrokerSelect(props: {
  value: string | ''; // '' means All (for filters) or can be a concrete broker in forms
  onChange: (v: string | '') => void;
  items: DropdownItem[];

  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  sx?: SxProps<Theme>;

  includeAllOption?: boolean; // for filter usage
  allLabel?: string; // optional
}) {
  const {
    value,
    onChange,
    items,
    label = 'Broker',
    size = 'small',
    disabled,
    sx,
    includeAllOption = false,
    allLabel = 'All',
  } = props;

  return (
    <FormControl size={size} sx={sx} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(e) => onChange(String(e.target.value))}>
        {includeAllOption && <MenuItem value="all">{allLabel}</MenuItem>}
        {items.map((b) => (
          <MenuItem key={b.value} value={b.value}>
            {b.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
