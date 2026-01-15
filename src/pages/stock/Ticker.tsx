import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, IconButton, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useMemo, useState } from 'react';
import { searchSymbols } from '../../services/stock/ticker-api';


import type { Market, StockClass, Bucket, TickerDTO, SymbolSuggestDTO } from '../../types/stock/ticker.types';
import { useSnackbar } from '../../components/common/SnackbarProvider';
import {
  createTicker,
  deleteTicker,
  listTickers,
  updateTicker,
} from '../../services/stock/ticker-api';
import StockShell from '../../components/stock/layout/StockShell';
import { useTickerOptions } from '../../hooks/stock/useTickerOptions';
import { SymbolAutosuggest } from '../../components/stock/ticker/SymbolAutosuggest';
import { MarketSelect } from '../../components/stock/shared/MarketSelect';
import { StockClassSelect } from '../../components/stock/shared/StockClassSelect';
import { StockClassMultiSelect } from '../../components/stock/shared/StockClassMultiSelect';
import { BucketSelect } from '../../components/stock/shared/BucketSelect';

type FilterState = {
  market: Market;
  stockClass: StockClass;
};

type FormState = {
  symbol: string;
  companyName: string;
  market: Market;
  stockClasses: StockClass[];
  industry: string;
  bucket: Bucket;
};

const DEFAULT_FORM: FormState = {
  symbol: '',
  companyName: '',
  market: 'canada',
  stockClasses: ['dividend'],
  industry: '',
  bucket: 'watch',
};

export default function Ticker() {
  const { showSnackbar } = useSnackbar();
  const { options, loading: optionsLoading } = useTickerOptions(true);

  // Page state
  const [filters, setFilters] = useState<FilterState>({ market: 'canada', stockClass: 'trade' });
  const [rows, setRows] = useState<TickerDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // dialog state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TickerDTO | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  // autosugegst symbol state
  const [symbolInput, setSymbolInput] = useState('');
  const [symbolOptions, setSymbolOptions] = useState<SymbolSuggestDTO[]>([]);
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolSuggestDTO | null>(null);

  // -------- Options helpers (key -> label) --------
  const marketItems = useMemo(
    () => (options ? Object.entries(options.market).map(([value, label]) => ({ value: value as Market, label })) : []),
    [options]
  );

  const classItems = useMemo(
    () => (options ? Object.entries(options.stockClass).map(([value, label]) => ({ value: value as StockClass, label })) : []),
    [options]
  );

  const bucketItems = useMemo(
    () => (options ? Object.entries(options.bucket).map(([value, label]) => ({ value: value as Bucket, label })) : []),
    [options]
  );

  const marketLabel = (m: Market) => options?.market?.[m] ?? m;
  const classLabel = (c: StockClass) => options?.stockClass?.[c] ?? c;
  const bucketLabel = (b: Bucket) => options?.bucket?.[b] ?? b;

  useEffect(() => {
    if (!open) return; // your dialog open boolean
    const q = symbolInput.trim();
    if (!q) { setSymbolOptions([]); return; }

    const t = setTimeout(async () => {
      setSymbolLoading(true);
      try {
        const data = await searchSymbols({ prefix: q, market: form.market, limit: 10 });
        setSymbolOptions(data);
      } catch {
        setSymbolOptions([]);
      } finally {
        setSymbolLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [open, symbolInput, form.market]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const data = await listTickers({
        market: filters.market,
        stockClass: filters.stockClass,
      });

      setRows(data);
    } catch {
      showSnackbar('Failed to load tickers', { severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.market, filters.stockClass]);

  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    resetSymbolSearch();
    setOpen(true);
  };

  const openEdit = (t: TickerDTO) => {
    setEditing(t);
    setForm({
      symbol: t.symbol,
      companyName: t.companyName,
      market: t.market,
      stockClasses: t.stockClasses,
      industry: t.industry,
      bucket: t.bucket,
    });

    // make the autosuggest show the current symbol
    setSelectedSymbol({
      symbolId: 0,
      symbol: t.symbol,
      description: t.companyName,
      lastPrice: null,
    } as any);
    setSymbolInput(t.symbol);
    setSymbolOptions([]); // avoid showing stale search results

    setOpen(true);
  };

  const resetSymbolSearch = () => {
    setSelectedSymbol(null);
    setSymbolInput('');
    setSymbolOptions([]);
    setSymbolLoading(false);
  };

  const closeDialog = () => {
    setOpen(false);
    resetSymbolSearch();
  };

  const canSave = useMemo(() => {
    // Prevent saving while options are still loading (avoids invalid/default keys)
    return (
      !optionsLoading &&
      form.symbol.trim().length >= 1 &&
      form.companyName.trim().length >= 1 &&
      form.stockClasses.length >= 1
    );
  }, [form, optionsLoading]);

  const save = async () => {
    if (!canSave) return;

    try {
      const payload = {
        symbol: form.symbol.trim().toUpperCase(),
        companyName: form.companyName.trim(),
        market: form.market,
        stockClasses: form.stockClasses,
        industry: form.industry,
        bucket: form.bucket,
      };

      if (!editing) {
        await createTicker(payload);
        showSnackbar('Ticker added', { severity: 'success' });
      } else {
        await updateTicker(editing.id, payload);
        showSnackbar('Ticker updated', { severity: 'success' });
      }

      closeDialog();
      await fetchRows();
    } catch {
      showSnackbar('Save failed', { severity: 'error' });
    }
  };

  const remove = async (t: TickerDTO) => {
    const ok = window.confirm(`Delete ${t.symbol}?`);
    if (!ok) return;

    try {
      await deleteTicker(t.id);
      showSnackbar('Ticker deleted', { severity: 'success' });
      await fetchRows();
    } catch {
      showSnackbar('Delete failed', { severity: 'error' });
    }
  };

  return (
    <StockShell>
      <Box>
        {/* Top bar */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Tickers
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add ticker
          </Button>
        </Stack>

        {/* Filters */}
        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr 1fr', md: '180px 180px 1fr' },
            alignItems: 'center',
          }}
        >
          <MarketSelect
            value={filters.market}
            items={marketItems}
            onChange={(v) => setFilters((p) => ({ ...p, market: v }))}
            disabled={optionsLoading}
          />

          <StockClassSelect
            value={filters.stockClass}
            items={classItems}
            onChange={(v) => setFilters((p) => ({ ...p, stockClass: v }))}
            disabled={optionsLoading}
          />

          <Box sx={{ justifySelf: { xs: 'start', md: 'end' }, opacity: 0.75 }}>
            {loading ? 'Loading…' : `${rows.length} tickers`}
          </Box>
        </Box>

        {/* List */}
        <Box sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell sx={{ width: 180 }}>Company</TableCell>
                <TableCell>Market</TableCell>
                <TableCell>Classes</TableCell>
                <TableCell sx={{ width: 180 }}>Industry</TableCell>
                <TableCell>Bucket</TableCell>
                <TableCell sx={{ width: 96 }} />
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{t.symbol}</TableCell>
                  <TableCell>{t.companyName}</TableCell>
                  <TableCell>{marketLabel(t.market)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap">
                      {t.stockClasses.map((c) => (
                        <Chip key={c} size="small" label={classLabel(c)} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{t.industry}</TableCell>
                  <TableCell>{bucketLabel(t.bucket)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(t)} aria-label="Edit">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => void remove(t)} aria-label="Delete">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ opacity: 0.7, py: 3 }}>
                    No tickers yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>

        {/* Create/Edit Dialog */}
        <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
          <DialogTitle>{editing ? `Edit ${editing.symbol}` : 'Add ticker'}</DialogTitle>

          <DialogContent sx={{ display: 'grid', gap: 1.5 }}>
            <MarketSelect
              value={form.market}
              items={marketItems}
              disabled={optionsLoading}
              sx={{ mt: 1 }}
              onChange={(v) => {
                setForm((p) => ({ ...p, market: v, symbol: '' }));

                setSelectedSymbol(null);
                setSymbolInput('');
                setSymbolOptions([]);
              }}
            />

            <SymbolAutosuggest
              value={selectedSymbol}
              onChange={(opt) => {
                setSelectedSymbol(opt);
                setForm(p => ({
                  ...p,
                  symbol: opt?.symbol ?? '',
                  // auto-fill companyName only if empty
                  companyName: p.companyName?.trim() ? p.companyName : (opt?.description ?? ''),
                }));
              }}
              inputValue={symbolInput}
              onInputChange={setSymbolInput}
              options={symbolOptions}
              loading={symbolLoading}
            />

            <TextField
              size="small"
              label="Company name"
              value={form.companyName}
              onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
            />

            <StockClassMultiSelect
              value={form.stockClasses}
              items={classItems}
              onChange={(next) => setForm((p) => ({ ...p, stockClasses: next }))}
              disabled={optionsLoading}
            />

            <TextField
              size="small"
              label="Industry"
              value={form.industry}
              onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
            />

            <BucketSelect
              value={form.bucket}
              items={bucketItems}
              disabled={optionsLoading}
              onChange={(v) => setForm((p) => ({ ...p, bucket: v }))}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={closeDialog}>CANCEL</Button>
            <Button variant="contained" onClick={() => void save()} disabled={!canSave}>
              SAVE
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </StockShell>
  );
}
