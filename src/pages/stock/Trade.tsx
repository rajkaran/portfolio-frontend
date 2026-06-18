import { useEffect, useMemo, useRef, useState } from 'react';
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
  TablePagination,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import StockShell from '../../components/stock/layout/StockShell';
import { useSnackbar } from '../../components/common/SnackbarProvider';
import { listTickerLatest } from '../../services/stock/ticker-api';
import { deleteTrade, countTrades, listTradesPaged } from '../../services/stock/trade-api';
import type { TradeDTO, TradeType, TradeWsMsg } from '../../types/stock/trade.types';
import { CreateTradeDialog } from '../../components/stock/shared/CreateTradeDialog';
import { TickerAutosuggest } from '../../components/stock/shared/TickerAutosuggest';
import { BrokerSelect } from '../../components/stock/shared/BrokerSelect';
import { connectPricesWs } from '../../services/stock/prices-ws';
import type { TickerOption } from '../../types/stock/ticker.types';
import { useBrokerAccounts } from '../../hooks/stock/useBrokerAccounts';
import {
  getBrokerItems,
  getBrokerLabels,
  getDefaultBrokerAccountId,
} from '../../utils/stock/prepareDropdownOptions';

type TickerLite = {
  id: string;
  symbol: string;
  companyName?: string;
  bucket?: string;
};

export default function Trade() {
  const { showSnackbar } = useSnackbar();
  const { data: brokerAccounts, loading: brokerAccountsLoading } = useBrokerAccounts(true);

  const [tickers, setTickers] = useState<TickerLite[]>([]);

  const [rows, setRows] = useState<TradeDTO[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);

  // filters
  const [filterSymbols, setFilterSymbols] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<TradeType | ''>('');
  const [filterBrokerAccountId, setFilterBrokerAccountId] = useState('');

  // dialog
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TradeDTO | null>(null);

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // external updates (dashboard quick trade, etc.)
  const [externalDirty, setExternalDirty] = useState(false);

  // refresh token to force refetch
  const [refreshKey, setRefreshKey] = useState(0);

  // request safety
  const rowsReqIdRef = useRef(0);
  const countReqIdRef = useRef(0);

  const brokerItems = useMemo(() => getBrokerItems(brokerAccounts, undefined,  true), [brokerAccounts]);
  const brokerLabels = useMemo(() => getBrokerLabels(brokerAccounts, true), [brokerAccounts]);

  const defaultBrokerAccountId = useMemo(
    () => getDefaultBrokerAccountId(brokerItems),
    [brokerItems],
  );

  const dialogInitialValues = useMemo(() => {
    if (!editing) return undefined;

    return {
      tickerId: editing.tickerId,
      tradeType: editing.tradeType,
      brokerAccountId: editing.brokerAccountId ?? defaultBrokerAccountId,
      rate: String(editing.rate ?? ''),
      quantity: String(editing.quantity ?? '1'),
      totalAmount: String(editing.totalAmount ?? ''),
      profit: editing.profit != null ? String(editing.profit) : '',
      tradeDatetimeIso: new Date(editing.tradeDatetime).toISOString(),
      brokerageFee: editing.brokerageFee != null ? String(editing.brokerageFee) : '0',
      purpose: editing.purpose ?? '',
      reason: editing.reason ?? '',
    };
  }, [editing, defaultBrokerAccountId]);

  const tickerOptions: TickerOption[] = useMemo(
    () =>
      tickers.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        companyName: t.companyName,
        bucket: t.bucket,
      })),
    [tickers],
  );

  const bySymbol = useMemo(() => new Map(tickerOptions.map((t) => [t.symbol, t])), [tickerOptions]);

  const selectedTickers = useMemo(
    () => filterSymbols.map((sym) => bySymbol.get(sym)).filter(Boolean) as TickerOption[],
    [filterSymbols, bySymbol],
  );

  const apiFilters = useMemo(
    () => ({
      symbols: filterSymbols.length ? filterSymbols : undefined,
      tradeType: filterType || undefined,
      brokerAccountId: filterBrokerAccountId || undefined,
    }),
    [filterSymbols, filterType, filterBrokerAccountId],
  );

  const refresh = (goFirstPage: boolean) => {
    if (goFirstPage) setPage(0);
    setExternalDirty(false);
    setRefreshKey((k) => k + 1);
  };

  // load tickers once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const t = await listTickerLatest();
        if (cancelled) return;

        setTickers(
          (t ?? []).map((x) => ({
            id: x.id,
            symbol: x.symbol,
            companyName: x.companyName,
            bucket: x.bucket,
          })),
        );
      } catch (e: any) {
        if (!cancelled) showSnackbar(e?.message ?? 'Failed to load tickers', { severity: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // websocket: if trade happens elsewhere (Dashboard quick trade), refresh page 0 automatically
  useEffect(() => {
    const ws = connectPricesWs({
      onPriceUpdate: () => {}, // had to add this because its required in websocket class
      onTrade: (_m: TradeWsMsg) => {
        if (page === 0) {
          refresh(false);
        } else {
          setExternalDirty(true);
        }
      },
    });

    return () => ws.close();
    // we intentionally only care about current page number
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // when filters change: reset to first page
  useEffect(() => {
    setPage(0);
  }, [filterSymbols, filterType, filterBrokerAccountId]);

  // COUNT: only when filters change or refreshKey changes (NOT on page change)
  useEffect(() => {
    let cancelled = false;
    const reqId = ++countReqIdRef.current;

    (async () => {
      try {
        const c = await countTrades(apiFilters);
        if (cancelled) return;
        if (reqId !== countReqIdRef.current) return;

        setTotalCount(c);

        // If current page became invalid due to deletions/filtering, snap to last valid page.
        const maxPage = Math.max(0, Math.ceil(c / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
      } catch (e: any) {
        if (!cancelled)
          showSnackbar(e?.message ?? 'Failed to load trades count', { severity: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFilters, refreshKey, rowsPerPage]);

  // ROWS: depends on page/rowsPerPage/filters/refreshKey
  useEffect(() => {
    let cancelled = false;
    const reqId = ++rowsReqIdRef.current;

    (async () => {
      setLoading(true);
      try {
        const limit = rowsPerPage;
        const skip = page * rowsPerPage;

        const tr = await listTradesPaged({
          ...apiFilters,
          limit,
          skip,
        });

        if (cancelled) return;
        if (reqId !== rowsReqIdRef.current) return;

        setRows(tr);
      } catch (e: any) {
        if (!cancelled) showSnackbar(e?.message ?? 'Failed to load trades', { severity: 'error' });
      } finally {
        if (!cancelled && reqId === rowsReqIdRef.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFilters, page, rowsPerPage, refreshKey]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(t: TradeDTO) {
    setEditing(t);
    setOpen(true);
  }

  async function onDelete(t: TradeDTO) {
    const ok = window.confirm(
      `Delete trade for ${t.symbol} (${t.tradeType} ${t.quantity} @ ${t.rate})?`,
    );
    if (!ok) return;

    try {
      await deleteTrade(t.id);
      showSnackbar('Trade deleted', { severity: 'success' });

      // safest UX: go first page, refresh count+rows
      refresh(true);
    } catch (e: any) {
      showSnackbar(e?.message ?? 'Delete failed', { severity: 'error' });
    }
  }

  return (
    <StockShell>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Trades
          </Typography>

          {externalDirty && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              onClick={() => refresh(true)}
            >
              New trades
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => refresh(false)}>
              <RefreshOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Button variant="contained" onClick={openCreate}>
            Add Trade
          </Button>
        </Box>
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
              onChange={(next) => setFilterSymbols(next.map((t) => t.symbol))}
              label="Tickers"
              placeholder="Filter trades by ticker(s)"
              />

            <FormControl size="small">
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TradeType | '')}
                >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="buy">Buy</MenuItem>
                <MenuItem value="sell">Sell</MenuItem>
              </Select>
            </FormControl>

            <BrokerSelect
              value={filterBrokerAccountId}
              onChange={setFilterBrokerAccountId}
              disabled={brokerAccountsLoading}
              items={brokerItems}
              includeAllOption
              allLabel="All Brokers"
              label="Broker"
              />
          </Box>

      {/* Grid "table" */}
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

        {rows.map((t) => (
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
            <Box>
              {t.brokerAccountId ? (brokerLabels[t.brokerAccountId] ?? t.brokerAccountId) : '-'}
            </Box>
            <Box>{new Date(t.tradeDatetime).toLocaleString()}</Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => openEdit(t)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  sx={{ '&:hover': { color: 'error.main' } }}
                  onClick={() => onDelete(t)}
                >
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ))}

        {!loading && rows.length === 0 && <Box sx={{ p: 3, opacity: 0.8 }}>No trades found.</Box>}
        {loading && <Box sx={{ p: 3, opacity: 0.8 }}>Loading…</Box>}
      </Box>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          const next = parseInt(e.target.value, 10);
          setRowsPerPage(next);
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      <CreateTradeDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSaved={async () => {
          // after create/edit: ordering changes -> go to first page and refresh count + rows
          refresh(true);
        }}
        mode="full"
        tickers={tickerOptions}
        brokerItems={brokerItems}
        defaultBrokerAccountId={defaultBrokerAccountId}
        editingTradeId={editing?.id}
        initialValues={dialogInitialValues}
      />
    </StockShell>
  );
}
