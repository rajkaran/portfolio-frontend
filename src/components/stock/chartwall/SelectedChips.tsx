import { Box, Chip } from '@mui/material';

export function SelectedChips(props: {
  symbols: string[];
  onRemove: (sym: string) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
      {props.symbols.map((sym) => (
        <Chip key={sym} label={sym} onDelete={() => props.onRemove(sym)} size="small" />
      ))}
    </Box>
  );
}
