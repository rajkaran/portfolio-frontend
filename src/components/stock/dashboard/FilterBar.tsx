import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { isDefined } from '../../../utils/stock/filter';
import type {
  SortBy,
  StockClass,
  StockFilters,
  TickerLatestDTO,
  TickerOption,
} from '../../../types/stock/ticker.types';
import { MarketSelect } from '../shared/MarketSelect';
import { StockClassSelect } from '../shared/StockClassSelect';
import { TickerAutosuggest } from '../shared/TickerAutosuggest';
import { useMemo } from 'react';
import { useKeyValuePairs } from '../../../hooks/stock/useKeyValuePairs';
import { useStockExchanges } from '../../../hooks/stock/useStockExchanges';

export default function FilterBar({
  value,
  onChange,
  tickers,
  loading,
}: {
  value: StockFilters;
  onChange: (next: StockFilters) => void;
  tickers: TickerLatestDTO[]; // candidates (already loaded)
  loading?: boolean;
}) {
  const keyValueIds = useMemo(() => ['stockClass'], []);
  const { data: keyValuePairs, loading: pairsLoading } = useKeyValuePairs(keyValueIds);
  const { data: exchanges, loading: exchangesLoading } = useStockExchanges(true);

  const marketItems = useMemo(() => {
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];

    for (const exchange of exchanges) {
      const value = exchange.country.trim().toLowerCase();

      if (seen.has(value)) continue;
      seen.add(value);

      result.push({ value, label: exchange.country });
    }

    result.sort((a, b) => a.label.localeCompare(b.label));
    return result;
  }, [exchanges]);

  const classItems = useMemo(
    () =>
      keyValuePairs?.stockClass
        ? Object.entries(keyValuePairs.stockClass).map(([value, label]) => ({
            value: value as StockClass,
            label,
          }))
        : [],
    [keyValuePairs?.stockClass],
  );

  const set = <K extends keyof StockFilters>(key: K, v: StockFilters[K]) => {
    onChange({ ...value, [key]: v });
  };

  // Convert TickerLatestDTO -> TickerOption
  const optionList: TickerOption[] = useMemo(
    () =>
      tickers.map((o) => ({
        id: o.id,
        symbol: o.symbol,
        companyName: o.companyName,
        bucket: o.bucket,
      })),
    [tickers],
  );

  // Map options by symbol for quick lookup
  const bySymbol = useMemo(() => new Map(optionList.map((o) => [o.symbol, o])), [optionList]);

  const selectedTickers: TickerOption[] = value.symbols
    .map((sym) => bySymbol.get(sym))
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
        value={marketItems.length ? value.market : ''}
        items={marketItems}
        onChange={(v) => set('market', v)}
        disabled={exchangesLoading}
        sx={{ minWidth: 0 }}
      />

      <StockClassSelect
        value={classItems.length ? value.stockClass : ''}
        items={classItems}
        onChange={(v) => set('stockClass', v)}
        disabled={pairsLoading}
        sx={{ minWidth: 0 }}
      />

      <FormControl size="small" sx={{ minWidth: 0 }}>
        <InputLabel>Sort by</InputLabel>
        <Select
          label="Sort by"
          value={value.sortBy}
          onChange={(e) => set('sortBy', e.target.value as SortBy)}
        >
          <MenuItem value="az">A → Z</MenuItem>
          <MenuItem value="za">Z → A</MenuItem>
          <MenuItem value="bucket">Bucket (core→watch→once→avoid)</MenuItem>
          <MenuItem value="favorability">Favorability</MenuItem>
        </Select>
      </FormControl>

      <TickerAutosuggest
        tickers={optionList}
        value={selectedTickers}
        onChange={(next) =>
          set(
            'symbols',
            next.map((t) => t.symbol),
          )
        }
        disabled={loading}
        label="Tickers"
        placeholder="Type symbol or company name"
      />
    </Box>
  );
}
