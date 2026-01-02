import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Autocomplete
} from '@mui/material';
import StockShell from '../../components/stock/layout/StockShell';
import { useSnackbar } from '../../components/common/SnackbarProvider';

import { listTickerLatest } from '../../services/stock/ticker-api';
import { createTrade, deleteTrade, listTrades, updateTrade } from '../../services/stock/trade-api';
import type { TradeDTO, TradeType, CreateTradeDTO } from '../../types/stock/trade.types';
import { useTickerOptions } from '../../hooks/stock/useTickerOptions';

type TickerLite = {
  id: string;
  symbol: string;
  companyName?: string;
  lastPrice?: number;
  avgBookCost?: number;
  quantityHolding?: number;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function calcPreview(args: {
  tradeType: TradeType;
  currentQty: number;
  currentAvg: number;
  rate: number;
  qty: number;
}) {
  const { tradeType, currentQty, currentAvg, rate, qty } = args;

  if (qty <= 0 || rate <= 0) {
    return { nextQty: currentQty, nextAvg: currentAvg, profit: undefined as number | undefined };
  }

  if (tradeType === 'buy') {
    const nextQty = currentQty + qty;
    const nextAvg = nextQty === 0 ? 0 : (currentAvg * currentQty + rate * qty) / nextQty;
    return { nextQty, nextAvg, profit: undefined };
  }

  // sell
  const nextQty = currentQty - qty;
  const profit = rate * qty - currentAvg * qty;
  const nextAvg = nextQty <= 0 ? 0 : currentAvg;
  return { nextQty: Math.max(0, nextQty), nextAvg, profit };
}

export default function Trade() {
  const { showSnackbar } = useSnackbar();
  const { options } = useTickerOptions(true);

  const [tickers, setTickers] = useState<TickerLite[]>([]);
  const [trades, setTrades] = useState<TradeDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [filterTickerId, setFilterTickerId] = useState<string>('');
  const [filterType, setFilterType] = useState<TradeType | ''>('');
  const [filterQ, setFilterQ] = useState('');

  // dialog
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TradeDTO | null>(null);

  // form
  const [tickerId, setTickerId] = useState('');
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [rate, setRate] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [brokerageFee, setBrokerageFee] = useState<number>(0);
  const [broker, setBroker] = useState('');
  const [tradeDatetime, setTradeDatetime] = useState<string>(() => {
    // local datetime input expects "YYYY-MM-DDTHH:mm"
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });

  // known brokers
  const brokers = useMemo(
    () => (options ? Object.entries(options.broker).map(([value, label]) => ({ value: value, label })) : []),
    [options]
  );

  //profit field
  const [profit, setProfit] = useState<string>('');
  const [profitTouched, setProfitTouched] = useState(false);

  const [overrideAvgBookCost, setOverrideAvgBookCost] = useState<string>('');
  const [overrideQuantityHolding, setOverrideQuantityHolding] = useState<string>('');

  const selectedTicker = useMemo(
    () => tickers.find(t => t.id === tickerId) ?? null,
    [tickers, tickerId],
  );

  const currentQty = Number(selectedTicker?.quantityHolding ?? 0);
  const currentAvg = Number(selectedTicker?.avgBookCost ?? 0);

  const preview = useMemo(() => {
    return calcPreview({
      tradeType,
      currentQty,
      currentAvg,
      rate: Number(rate || 0),
      qty: Number(quantity || 0),
    });
  }, [tradeType, currentQty, currentAvg, rate, quantity]);

  useEffect(() => {
    if (tradeType !== 'sell') {
      setProfit('');
      setProfitTouched(false);
      return;
    }

    if (!profitTouched) {
      setProfit(String(round2(Number(preview.profit ?? 0))));
    }
  }, [tradeType, preview.profit, profitTouched]);

  const canSubmit = useMemo(() => {
    if (!tickerId) return false;
    if (!(Number(rate) > 0)) return false;
    if (!(Number(quantity) > 0)) return false;
    if (tradeType === 'sell' && Number(quantity) > currentQty) return false;
    return true;
  }, [tickerId, rate, quantity, tradeType, currentQty]);

  async function loadAll() {
    setLoading(true);
    try {
      const t = await listTickerLatest();
      setTickers(
        (t ?? []).map((x: any) => ({
          id: x.id,
          symbol: x.symbol,
          companyName: x.companyName,
          lastPrice: x.lastPrice,
          avgBookCost: x.avgBookCost,
          quantityHolding: x.quantityHolding,
        })),
      );

      const tr = await listTrades({
        tickerId: filterTickerId || undefined,
        tradeType: (filterType as any) || undefined,
        q: filterQ || undefined,
      });
      setTrades(tr);
    } catch (e: any) {
      showSnackbar(e?.message ?? 'Failed to load trades', { severity: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTickerId, filterType]);

  function resetForm() {
    setTickerId('');
    setTradeType('buy');
    setRate(0);
    setQuantity(0);
    setBrokerageFee(0);
    setBroker('');
    const d = new Date();
    d.setSeconds(0, 0);
    setTradeDatetime(d.toISOString().slice(0, 16));
    setOverrideAvgBookCost('');
    setOverrideQuantityHolding('');
    setProfit('');
    setProfitTouched(false);
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setOpen(true);
    setProfit('');
    setProfitTouched(false);
  }

  function openEdit(t: TradeDTO) {
    setEditing(t);
    setTickerId(t.tickerId);
    setTradeType(t.tradeType);
    setRate(t.rate);
    setQuantity(t.quantity);
    setBrokerageFee(Number(t.brokerageFee ?? 0));
    setBroker(t.broker ?? '');

    // convert ISO -> local input string
    const dt = new Date(t.tradeDatetime);
    dt.setSeconds(0, 0);
    setTradeDatetime(dt.toISOString().slice(0, 16));

    setOverrideAvgBookCost(t.overrideAvgBookCost != null ? String(t.overrideAvgBookCost) : '');
    setOverrideQuantityHolding(t.overrideQuantityHolding != null ? String(t.overrideQuantityHolding) : '');

    setProfit(t.profit != null ? String(t.profit) : '');
    setProfitTouched(false);

    setOpen(true);
  }

  async function onSave() {
    if (!canSubmit) return;

    try {
      const ticker = tickers.find(x => x.id === tickerId);
      if (!ticker) throw new Error('Ticker not found');

      const dto: CreateTradeDTO = {
        tickerId,
        symbol: ticker.symbol,
        tradeType,
        rate: Number(rate),
        quantity: Number(quantity),
        // Keep fee for reporting, but don’t use it in profit math right now
        brokerageFee: Number(brokerageFee || 0),
        broker: broker || undefined,

        // backend expects ISO; store UTC
        tradeDatetime: new Date(tradeDatetime).toISOString(),

        // totalAmount: (keep consistent; buy=cost, sell=proceeds, fee ignored in math per your rule)
        totalAmount: tradeType === 'buy' ? Number(rate) * Number(quantity) : Number(rate) * Number(quantity),

        profit: tradeType === 'sell' ? (profit.trim() ? Number(profit) : round2(Number(preview.profit ?? 0))) : undefined,

        overrideAvgBookCost: overrideAvgBookCost.trim() ? Number(overrideAvgBookCost) : undefined,
        overrideQuantityHolding: overrideQuantityHolding.trim() ? Number(overrideQuantityHolding) : undefined,
      };

      if (editing) {
        await updateTrade(editing.id, dto);
        showSnackbar('Trade updated', { severity: 'success' });
      } else {
        await createTrade(dto);
        showSnackbar('Trade created', { severity: 'success' });
      }

      setOpen(false);
      await loadAll();
    } catch (e: any) {
      showSnackbar(e?.message ?? 'Save failed', { severity: 'error' });
    }
  }

  async function onDelete(t: TradeDTO) {
    const ok = window.confirm(`Delete trade for ${t.symbol} (${t.tradeType} ${t.quantity} @ ${t.rate})?`);
    if (!ok) return;

    try {
      await deleteTrade(t.id);
      showSnackbar('Trade deleted', { severity: 'success' });
      await loadAll();
    } catch (e: any) {
      showSnackbar(e?.message ?? 'Delete failed', { severity: 'error' });
    }
  }

  return (
    <StockShell>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Trades
        </Typography>

        <Button variant="contained" onClick={openCreate}>
          Add Trade
        </Button>
      </Stack>

      {/* Filters */}
      <Box
        sx={{
          bgcolor: 'rgba(255,255,255,0.06)',
          p: 2,
          borderRadius: 2,
          mb: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: '2fr 1fr 2fr' },
          gap: 1.5,
        }}
      >
        <FormControl size="small">
          <InputLabel>Ticker</InputLabel>
          <Select
            label="Ticker"
            value={filterTickerId}
            onChange={e => setFilterTickerId(String(e.target.value))}
          >
            <MenuItem value="">All</MenuItem>
            {tickers.map(t => (
              <MenuItem key={t.id} value={t.id}>
                {t.symbol} {t.companyName ? `— ${t.companyName}` : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="buy">Buy</MenuItem>
            <MenuItem value="sell">Sell</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Search (symbol/broker)"
          value={filterQ}
          onChange={e => setFilterQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') loadAll();
          }}
          placeholder="e.g. CTC-A.TO or Questrade"
        />
      </Box>

      {/* Table */}
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 2fr 140px',
            gap: 1,
            px: 2,
            py: 1,
            fontSize: 13,
            opacity: 0.8,
          }}
        >
          <Box>Symbol</Box>
          <Box>Type</Box>
          <Box>Rate</Box>
          <Box>Qty</Box>
          <Box>Profit</Box>
          <Box>Trade Time</Box>
          <Box />
        </Box>

        <Divider />

        {trades.map(t => (
          <Box
            key={t.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 2fr 140px',
              gap: 1,
              px: 2,
              py: 1,
              alignItems: 'center',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Box sx={{ fontWeight: 500 }}>{t.symbol}</Box>
            <Box>{t.tradeType}</Box>
            <Box>{t.rate}</Box>
            <Box>{t.quantity}</Box>
            <Box>{t.tradeType === 'sell' ? (t.profit ?? '-') : '-'}</Box>
            <Box>{new Date(t.tradeDatetime).toLocaleString()}</Box>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" onClick={() => openEdit(t)}>
                Edit
              </Button>
              <Button size="small" color="error" onClick={() => onDelete(t)}>
                Delete
              </Button>
            </Stack>
          </Box>
        ))}

        {!loading && trades.length === 0 && (
          <Box sx={{ p: 3, opacity: 0.8 }}>
            No trades found.
          </Box>
        )}

        {loading && (
          <Box sx={{ p: 3, opacity: 0.8 }}>
            Loading…
          </Box>
        )}
      </Box>

      {/* Create/Edit dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Trade' : 'Add Trade'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={tickers}
              value={selectedTicker}
              onChange={(_, v) => {
                setTickerId(v?.id ?? '');
                if (v?.lastPrice) setRate(Number(v.lastPrice));
              }}
              getOptionLabel={(opt) => `${opt.symbol} ${opt.companyName ?? ''}`}
              filterOptions={(options, state) => {
                const q = state.inputValue.trim().toUpperCase();
                if (!q) return options;
                return options.filter(o =>
                  o.symbol.toUpperCase().includes(q) ||
                  (o.companyName ?? '').toUpperCase().includes(q)
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Ticker"
                  placeholder="Type symbol or company name"
                />
              )}
              renderOption={(props, opt) => (
                <Box component="li" {...props} key={opt.id} sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                      {opt.symbol}
                    </Typography>
                    <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
                      {opt.companyName ?? '—'}
                    </Typography>
                  </Box>
                </Box>
              )}
            />


            <Stack direction="row" spacing={1.5}>
              <FormControl size="small" fullWidth>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={tradeType} onChange={e => setTradeType(e.target.value as TradeType)}>
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                fullWidth
                label="Rate"
                type="number"
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
              />

              <TextField
                size="small"
                fullWidth
                label="Quantity"
                type="number"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                error={tradeType === 'sell' && Number(quantity) > currentQty}
                helperText={tradeType === 'sell' && Number(quantity) > currentQty ? `Holding is ${currentQty}` : ' '}
              />
            </Stack>

            <Stack direction="row" spacing={1.5}>
              {tradeType === 'sell' && (
                <TextField
                  size="small"
                  fullWidth
                  label="Profit"
                  type="number"
                  value={profit}
                  onChange={(e) => {
                    setProfit(e.target.value);
                    setProfitTouched(true);
                  }}
                  sx={{ minWidth: 120 }}
                />
              )}

              <TextField
                size="small"
                fullWidth
                label="Brokerage Fee"
                type="number"
                value={brokerageFee}
                onChange={e => setBrokerageFee(Number(e.target.value))}
              />

              <FormControl size="small" fullWidth>
                <InputLabel>Broker</InputLabel>
                <Select
                  label="Broker"
                  value={broker}
                  onChange={(e) => setBroker(String(e.target.value))}
                >
                  {brokers.map(b => (
                    <MenuItem key={b.value} value={b.value}>
                      {b.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              size="small"
              label="Trade Time"
              type="datetime-local"
              value={tradeDatetime}
              onChange={e => setTradeDatetime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            {/* Preview */}
            <Box sx={{ bgcolor: '#d5d5d5', p: 1, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Preview (from current ticker snapshot)
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75, }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: 11, lineHeight: 1.2 }}>Current Qty</Typography>
                  <Typography sx={{ fontSize: 12, lineHeight: 1.2 }}>{currentQty}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: 11, lineHeight: 1.2 }}>Current Avg Cost</Typography>
                  <Typography sx={{ fontSize: 12, lineHeight: 1.2 }}>{round2(currentAvg)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: 11, lineHeight: 1.2 }}>Next Qty</Typography>
                  <Typography sx={{ fontSize: 12, lineHeight: 1.2 }}>{preview.nextQty}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: 11, lineHeight: 1.2 }}>Next Avg Cost</Typography>
                  <Typography sx={{ fontSize: 12, lineHeight: 1.2 }}>{round2(preview.nextAvg)}</Typography>
                </Box>

                {tradeType === 'sell' && (
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Profit Preview (fee ignored)</Typography>
                    <Typography>{round2(Number(preview.profit ?? 0))}</Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Overrides */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                size="small"
                label="Override Avg Book Cost (optional)"
                type="number"
                value={overrideAvgBookCost}
                onChange={e => setOverrideAvgBookCost(e.target.value)}
              />
              <TextField
                size="small"
                label="Override Quantity Holding (optional)"
                type="number"
                value={overrideQuantityHolding}
                onChange={e => setOverrideQuantityHolding(e.target.value)}
              />
            </Box>

            {!selectedTicker && (
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                Select a ticker to see accurate preview.
              </Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSave} disabled={!canSubmit}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </StockShell>
  );
}
