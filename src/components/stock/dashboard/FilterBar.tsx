import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import type { StockFilters } from '../../../utils/stock/filter';
import type { Market, StockClass } from '../../../types/stock/ticker.types';
import type { SortBy } from '../../../utils/stock/filter';

export default function FilterBar({
  value,
  onChange,
}: {
  value: StockFilters;
  onChange: (next: StockFilters) => void;
}) {
  const set = <K extends keyof StockFilters>(key: K, v: StockFilters[K]) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        alignItems: 'center',
        // Mobile: 2 columns, Desktop: 4 columns (search fills last column)
        gridTemplateColumns: {
          xs: '1fr 1fr',
          md: '160px 160px 220px 1fr',
        },
      }}
    >
      <FormControl size="small" sx={{ minWidth: 0 }}>
        <InputLabel>Market</InputLabel>
        <Select
          label="Market"
          value={value.market}
          onChange={(e) => set('market', e.target.value as Market | 'canada')}
        >
          <MenuItem value="canada">Canada</MenuItem>
          <MenuItem value="usa">USA</MenuItem>
          <MenuItem value="india">India</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 0 }}>
        <InputLabel>Class</InputLabel>
        <Select
          label="Class"
          value={value.stockClass}
          onChange={(e) => set('stockClass', e.target.value as StockClass | 'trade')}
        >
          <MenuItem value="dividend">Dividend</MenuItem>
          <MenuItem value="trade">Trade</MenuItem>
          <MenuItem value="longTerm">Long Term</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 0 }}>
        <InputLabel>Sort by</InputLabel>
        <Select
          label="Sort by"
          value={value.sortBy}
          onChange={(e) => set('sortBy', e.target.value as SortBy)}
        >
          <MenuItem value="category">Category</MenuItem>
          <MenuItem value="mostTraded">Most traded</MenuItem>
          <MenuItem value="gainers">Gainers</MenuItem>
          <MenuItem value="closeToThresholds">Close to thresholds</MenuItem>
        </Select>
      </FormControl>

      <TextField
        size="small"
        label="Search"
        value={value.search}
        onChange={(e) => set('search', e.target.value)}
        sx={{ minWidth: 0 }}
      />
    </Box>
  );
}
