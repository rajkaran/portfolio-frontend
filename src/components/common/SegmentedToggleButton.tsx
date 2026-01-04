import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedToggleButton<T extends string>(props: {
  value: T;
  onChange: (next: T) => void;
  options: Array<SegmentedOption<T>>;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const { value, onChange, options, size = 'medium', disabled, ariaLabel } = props;

  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      disabled={disabled}
      onChange={(_, v) => {
        if (!v) return;       // ignore “unselect”
        onChange(v as T);
      }}
      aria-label={ariaLabel}
      sx={{
        borderRadius: 999,
        p: 0.25,
        bgcolor: 'rgba(0,0,0,0.06)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.18)',
        '& .MuiToggleButtonGroup-grouped': {
          border: 0,
          borderRadius: 999,
          mx: 0.25,
          textTransform: 'none',
          fontWeight: 700,
          transition: 'all 120ms ease',
          ...(size === 'small'
            ? { px: 1.25, py: 0.5, fontSize: 12 }
            : size === 'large'
              ? { px: 2, py: 1, fontSize: 15 }
              : { px: 1.5, py: 0.75, fontSize: 13 }),
        },
        '& .MuiToggleButton-root': {
          color: 'rgba(0,0,0,0.65)',
          bgcolor: 'transparent',
        },
        '& .MuiToggleButton-root.Mui-selected': {
          bgcolor: 'rgba(13, 100, 231, 0.43)',
          color: 'rgba(0,0,0,0.9)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.16)',
        },
        '& .MuiToggleButton-root.Mui-selected:hover': {
          bgcolor: 'rgba(13, 100, 231, 0.43)',
        },
      }}
    >
      {options.map((opt) => (
        <ToggleButton key={opt.value} value={opt.value}>
          {opt.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
