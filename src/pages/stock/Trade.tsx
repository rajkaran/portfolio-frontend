import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import StockShell from '../../components/stock/layout/StockShell';
import { useSnackbar } from '../../components/common/SnackbarProvider';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';


import { listTickerLatest } from '../../services/stock/ticker-api';
import { deleteTrade, listTrades } from '../../services/stock/trade-api';
import type { Broker, TradeDTO, TradeType } from '../../types/stock/trade.types';
import { useTickerOptions } from '../../hooks/stock/useTickerOptions';
import { CreateTradeDialog } from '../../components/stock/shared/CreateTradeDialog';
import type { TickerOption } from '../../types/stock/ticker.types';
import { TickerAutosuggest } from '../../components/stock/shared/TickerAutosuggest';
import { BrokerSelect } from '../../components/stock/shared/BrokerSelect';

type TickerLite = {
  id: string;
  symbol: string;
  companyName?: string;
  lastPrice?: number;
  avgBookCost?: number;
  quantityHolding?: number;
};

export default function Trade() {
  const { showSnackbar } = useSnackbar();
  const { options, loading: optionsLoading } = useTickerOptions(true);

  const [tickers, setTickers] = useState<TickerLite[]>([]);
  const [trades, setTrades] = useState<TradeDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [filterSymbols, setFilterSymbols] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<TradeType | ''>('');
  const [filterBroker, setFilterBroker] = useState<Broker | ''>(''); // '' = All

  // dialog
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TradeDTO | null>(null);

  // known brokers
  const brokerItems = useMemo(
    () => (options ? Object.entries(options.broker).map(([value, label]) => ({ value: value, label })) : []),
    [options]
  );

  // ---- initialValues for edit mode ----
  const dialogInitialValues = useMemo(() => {
    if (!editing) return undefined;

    return {
      tickerId: editing.tickerId,
      tradeType: editing.tradeType,
      broker: editing.broker ?? '',
      rate: String(editing.rate ?? ''),
      quantity: String(editing.quantity ?? '1'),
      totalAmount: String(editing.totalAmount ?? ''),
      profit: editing.profit != null ? String(editing.profit) : '',
      tradeDatetimeIso: new Date(editing.tradeDatetime).toISOString(),
      brokerageFee: editing.brokerageFee != null ? String(editing.brokerageFee) : '0',
      overrideAvgBookCost: editing.overrideAvgBookCost != null ? String(editing.overrideAvgBookCost) : '',
      overrideQuantityHolding: editing.overrideQuantityHolding != null ? String(editing.overrideQuantityHolding) : '',
    };
  }, [editing]);


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
        symbols: filterSymbols.length ? filterSymbols : undefined,
        tradeType: (filterType as any) || undefined,
        broker: filterBroker || undefined,
      });
      setTrades(tr);
    } catch (e: any) {
      showSnackbar(e?.message ?? 'Failed to load trades', { severity: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const tickerOptions: TickerOption[] = useMemo(
    () => tickers.map(t => ({
      id: t.id,
      symbol: t.symbol,
      companyName: t.companyName,
      // bucket optional
    })),
    [tickers]
  );

  const bySymbol = useMemo(
    () => new Map(tickerOptions.map(t => [t.symbol, t])),
    [tickerOptions]
  );

  const selectedTickers = useMemo(
    () => filterSymbols.map(sym => bySymbol.get(sym)).filter(Boolean) as TickerOption[],
    [filterSymbols, bySymbol]
  );

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSymbols, filterType, filterBroker]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(t: TradeDTO) {
    setEditing(t);
    setOpen(true);
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
        <TickerAutosuggest
          tickers={tickerOptions}
          value={selectedTickers}
          onChange={(next) => setFilterSymbols(next.map(t => t.symbol))}
          label="Tickers"
          placeholder="Filter trades by ticker(s)"
        />

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

        <BrokerSelect
          value={filterBroker}
          onChange={setFilterBroker}
          disabled={optionsLoading}
          items={brokerItems}
          includeAllOption
          label="All Brokers"
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
          <Box>Broker</Box>
          <Box>Trade Time</Box>
          <Box />
        </Box>

        <Divider />

        {trades.map(t => (
          <Box
            key={t.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr 96px',
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
            <Box>{t.broker}</Box>
            <Box>{new Date(t.tradeDatetime).toLocaleString()}</Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => openEdit(t)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete">
                <IconButton size="small" color="error" sx={{ '&:hover': { color: 'error.main' } }} onClick={() => onDelete(t)}>
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
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
      <CreateTradeDialog
        open={open}
        onClose={() => setOpen(false)}
        onSaved={loadAll}
        mode="full"
        tickers={tickerOptions}
        brokerItems={brokerItems}
        editingTradeId={editing?.id}
        initialValues={dialogInitialValues}
      />

    </StockShell >
  );
}
