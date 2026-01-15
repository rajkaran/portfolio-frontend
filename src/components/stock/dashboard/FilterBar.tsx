import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { isDefined } from '../../../utils/stock/filter';
import type { Market, SortBy, StockClass, StockFilters, TickerLatestDTO, TickerOption } from '../../../types/stock/ticker.types';
import { MarketSelect } from '../shared/MarketSelect';
import { StockClassSelect } from '../shared/StockClassSelect';
import { TickerAutosuggest } from '../shared/TickerAutosuggest';
import { useTickerOptions } from '../../../hooks/stock/useTickerOptions';
import { useMemo } from 'react';

export default function FilterBar({
  value,
  onChange,
  tickers,
  loading,
}: {
  value: StockFilters;
  onChange: (next: StockFilters) => void;
  tickers: TickerLatestDTO[];     // candidates (already loaded)
  loading?: boolean;
}) {
  const { options, loading: optionsLoading } = useTickerOptions(true);

  // -------- Options helpers (key -> label) --------
  const marketItems = useMemo(
    () => (options ? Object.entries(options.market).map(([value, label]) => ({ value: value as Market, label })) : []),
    [options]
  );

  const classItems = useMemo(
    () => (options ? Object.entries(options.stockClass).map(([value, label]) => ({ value: value as StockClass, label })) : []),
    [options]
  );

  const set = <K extends keyof StockFilters>(key: K, v: StockFilters[K]) => {
    onChange({ ...value, [key]: v });
  };

  // Convert TickerLatestDTO -> TickerOption
  const optionList: TickerOption[] = tickers.map(o => ({
    id: o.id,
    symbol: o.symbol,
    companyName: o.companyName,
    bucket: o.bucket,
  }));

  // Map options by symbol for quick lookup
  const bySymbol = new Map(optionList.map(o => [o.symbol, o]));

  const selectedTickers: TickerOption[] = value.symbols
    .map(sym => bySymbol.get(sym))
    .filter(isDefined);

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        alignItems: 'center',
        gridTemplateColumns: {
          xs: '1fr 1fr',
          md: '160px 160px 220px 1fr',
        },
      }}
    >
      <MarketSelect
        value={value.market}
        items={marketItems}
        onChange={(v) => set('market', v)}
        disabled={optionsLoading}
        sx={{ minWidth: 0 }}
      />

      <StockClassSelect
        value={value.stockClass}
        items={classItems}
        onChange={(v) => set('stockClass', v)}
        disabled={optionsLoading}
        sx={{ minWidth: 0 }}
      />

      <FormControl size="small" sx={{ minWidth: 0 }}>
        <InputLabel>Sort by</InputLabel>
        <Select label="Sort by" value={value.sortBy} onChange={(e) => set('sortBy', e.target.value as SortBy)}>
          <MenuItem value="az">A → Z</MenuItem>
          <MenuItem value="za">Z → A</MenuItem>
          <MenuItem value="bucket">Bucket (core→watch→once→avoid)</MenuItem>
          <MenuItem value="favorability">Favorability</MenuItem>
        </Select>
      </FormControl>

      <TickerAutosuggest
        tickers={optionList}
        value={selectedTickers}
        onChange={(next) => set('symbols', next.map((t: any) => t.symbol))}
        disabled={loading}
        label="Tickers"
        placeholder="Type symbol or company name"
      />
    </Box>
  );
}
