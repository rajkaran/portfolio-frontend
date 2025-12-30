import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useMemo, useState } from 'react';

import type { Market, StockClass, Bucket } from '../../types/stock/ticker.types';
import { useSnackbar } from '../../components/common/SnackbarProvider';
import {
  createTicker,
  deleteTicker,
  listTickers,
  updateTicker,
  type TickerDTO,
} from '../../services/stock/ticker-api';
import StockShell from '../../components/stock/layout/StockShell';
import { useTickerOptions } from '../../hooks/stock/useTickerOptions';

type FilterState = {
  market: 'all' | Market;
  stockClass: 'all' | StockClass;
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
  const [filters, setFilters] = useState<FilterState>({ market: 'all', stockClass: 'all' });
  const [rows, setRows] = useState<TickerDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // dialog state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TickerDTO | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

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

  // Normalize MUI Select multiple value (can be string in autofill edge case)
  const normalizeMulti = (value: unknown): StockClass[] => {
    if (Array.isArray(value)) return value as StockClass[];
    if (typeof value === 'string') return value.split(',').map((x) => x.trim()) as StockClass[];
    return [];
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const data = await listTickers({
        market: filters.market === 'all' ? undefined : filters.market,
        stockClass: filters.stockClass === 'all' ? undefined : filters.stockClass,
      });
      console.log('Fetched tickers:', data);
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
    setOpen(true);
  };

  const closeDialog = () => setOpen(false);

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
          <FormControl size="small">
            <InputLabel>Market</InputLabel>
            <Select
              label="Market"
              value={filters.market}
              disabled={optionsLoading}
              onChange={(e) => setFilters((p) => ({ ...p, market: e.target.value as FilterState['market'] }))}
            >
              <MenuItem value="all">All</MenuItem>
              {marketItems.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Class</InputLabel>
            <Select
              label="Class"
              value={filters.stockClass}
              disabled={optionsLoading}
              onChange={(e) =>
                setFilters((p) => ({ ...p, stockClass: e.target.value as FilterState['stockClass'] }))
              }
            >
              <MenuItem value="all">All</MenuItem>
              {classItems.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>{editing ? `Edit ${editing.symbol}` : 'Add ticker'}</DialogTitle>

          <DialogContent sx={{ display: 'grid', gap: 1.5 }}>
            <TextField
              size="small"
              label="Symbol"
              sx={{ mt: 1 }}
              value={form.symbol}
              onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))}
            />
            <TextField
              size="small"
              label="Company name"
              value={form.companyName}
              onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
            />

            <FormControl size="small">
              <InputLabel>Market</InputLabel>
              <Select
                label="Market"
                value={form.market}
                disabled={optionsLoading}
                onChange={(e) => setForm((p) => ({ ...p, market: e.target.value as Market }))}
              >
                {optionsLoading ? (
                  <MenuItem value={form.market} disabled>Loading…</MenuItem>
                ) : (
                  marketItems.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Classes</InputLabel>
              <Select
                multiple
                label="Classes"
                value={form.stockClasses}
                disabled={optionsLoading}
                onChange={(e) => {
                  const next = normalizeMulti(e.target.value);
                  setForm((p) => ({ ...p, stockClasses: next }));
                }}
                renderValue={(selected) =>
                  (selected as StockClass[]).map((c) => classLabel(c)).join(', ')
                }
              >
                {optionsLoading ? (
                  <MenuItem disabled>Loading…</MenuItem>
                ) : (
                  classItems.map((c) => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Industry"
              value={form.industry}
              onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
            />

            <FormControl size="small">
              <InputLabel>Bucket</InputLabel>
              <Select
                label="Bucket"
                value={form.bucket}
                onChange={(e) => setForm((p) => ({ ...p, bucket: e.target.value as Bucket }))}
              >
                {optionsLoading ? (
                  <MenuItem value={form.bucket} disabled>Loading…</MenuItem>
                ) : (
                  bucketItems.map((b) => (
                    <MenuItem key={b.value} value={b.value}>{b.label}</MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
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
