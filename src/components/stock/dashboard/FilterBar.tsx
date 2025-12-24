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
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Market</InputLabel>
        <Select
          label="Market"
          value={value.market}
          onChange={(e) => set('market', e.target.value as Market | 'all')}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="canada">Canada</MenuItem>
          <MenuItem value="usa">USA</MenuItem>
          <MenuItem value="india">India</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Class</InputLabel>
        <Select
          label="Class"
          value={value.stockClass}
          onChange={(e) => set('stockClass', e.target.value as StockClass | 'all')}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="dividend">Dividend</MenuItem>
          <MenuItem value="trade">Trade</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 220 }}>
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
        sx={{ flex: 1, minWidth: 240 }}
      />
    </Box>
  );
}
