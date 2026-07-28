import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import {
  deleteDividend,
  countDividends,
  listDividendsPaged,
} from '../../services/stock/dividend-api';
import type { DividendDTO } from '../../types/stock/dividend.types';
import { CreateDividendDialog } from '../../components/stock/shared/CreateDividendDialog';
import { TickerAutosuggest } from '../../components/stock/shared/TickerAutosuggest';
import { BrokerSelect } from '../../components/stock/shared/BrokerSelect';
import type { TickerOption } from '../../types/stock/ticker.types';
import { useBrokerAccounts } from '../../hooks/stock/useBrokerAccounts';
import {
  getBrokerItems,
  getBrokerLabels,
  getDefaultBrokerAccountId,
} from '../../utils/stock/prepareDropdownOptions';

export default function Dividend() {
  const { showSnackbar } = useSnackbar();
  const { data: brokerAccounts, loading: brokerAccountsLoading } = useBrokerAccounts(true);

  const [tickers, setTickers] = useState<TickerOption[]>([]);

  const [rows, setRows] = useState<DividendDTO[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);

  // filters
  const [filterSymbols, setFilterSymbols] = useState<string[]>([]);
  const [filterBrokerAccountId, setFilterBrokerAccountId] = useState('all');

  // dialog
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DividendDTO | null>(null);

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // refresh token to force refetch
  const [refreshKey, setRefreshKey] = useState(0);

  // request safety
  const rowsReqIdRef = useRef(0);
  const countReqIdRef = useRef(0);

  const brokerItems = useMemo(
    () => getBrokerItems(brokerAccounts, undefined, true),
    [brokerAccounts],
  );
  const brokerLabels = useMemo(() => getBrokerLabels(brokerAccounts, true), [brokerAccounts]);

  const defaultBrokerAccountId = useMemo(
    () => getDefaultBrokerAccountId(brokerItems),
    [brokerItems],
  );

  const dialogInitialValues = useMemo(() => {
    if (!editing) return undefined;

    return {
      tickerId: editing.tickerId,
      brokerAccountId: editing.brokerAccountId,
      ratePerShare: editing.ratePerShare != null ? String(editing.ratePerShare) : '',
      quantity: editing.quantity != null ? String(editing.quantity) : '',
      amount: String(editing.amount),
      reinvested: !!editing.reinvested,
      payDatetimeIso: new Date(editing.payDatetime).toISOString(),
    };
  }, [editing, defaultBrokerAccountId]);

  const tickerOptions: TickerOption[] = useMemo(
    () =>
      tickers.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        companyName: t.companyName,
        bucket: t.bucket,
        positionsByBrokerAccount: t.positionsByBrokerAccount,
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
      brokerAccountId:
        !filterBrokerAccountId || filterBrokerAccountId === 'all'
          ? undefined
          : filterBrokerAccountId,
    }),
    [filterSymbols, filterBrokerAccountId],
  );

  const refresh = (goFirstPage: boolean) => {
    if (goFirstPage) setPage(0);
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
            positionsByBrokerAccount: x.positionsByBrokerAccount,
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

  // when filters change: reset to first page
  useEffect(() => {
    setPage(0);
  }, [filterSymbols, filterBrokerAccountId]);

  // COUNT: only when filters change or refreshKey changes (NOT on page change)
  useEffect(() => {
    let cancelled = false;
    const reqId = ++countReqIdRef.current;

    (async () => {
      try {
        const c = await countDividends(apiFilters);
        if (cancelled) return;
        if (reqId !== countReqIdRef.current) return;

        setTotalCount(c);

        const maxPage = Math.max(0, Math.ceil(c / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
      } catch (e: any) {
        if (!cancelled)
          showSnackbar(e?.message ?? 'Failed to load dividends count', { severity: 'error' });
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

        const dr = await listDividendsPaged({
          ...apiFilters,
          limit,
          skip,
        });

        if (cancelled) return;
        if (reqId !== rowsReqIdRef.current) return;

        setRows(dr);
      } catch (e: any) {
        if (!cancelled)
          showSnackbar(e?.message ?? 'Failed to load dividends', { severity: 'error' });
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

  function openEdit(d: DividendDTO) {
    setEditing(d);
    setOpen(true);
  }

  async function onDelete(d: DividendDTO) {
    const ok = window.confirm(`Delete dividend for ${d.symbol} (${d.amount})?`);
    if (!ok) return;

    try {
      await deleteDividend(d.id);
      showSnackbar('Dividend deleted', { severity: 'success' });

      refresh(true);
    } catch (e: any) {
      showSnackbar(e?.message ?? 'Delete failed', { severity: 'error' });
    }
  }

  return (
    <StockShell>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Dividends
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => refresh(false)}>
              <RefreshOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Button variant="contained" onClick={openCreate}>
            Add Dividend
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
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Box sx={{ width: '100%' }}>
          <TickerAutosuggest
            tickers={tickerOptions}
            value={selectedTickers}
            onChange={(next) => setFilterSymbols(next.map((t) => t.symbol))}
            label="Tickers"
            placeholder="Filter dividends by ticker(s)"
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <BrokerSelect
                value={filterBrokerAccountId}
                onChange={setFilterBrokerAccountId}
                disabled={brokerAccountsLoading}
                items={brokerItems}
                includeAllOption
                allLabel="All Brokers"
                label="Broker"
              />
            </FormControl>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500, px: 1 }}>
            Showing {totalCount} {totalCount === 1 ? 'dividend' : 'dividends'}
          </Typography>
        </Box>
      </Box>

      {/* Dividends table */}
      <TableContainer sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Symbol</TableCell>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Rate / Share</TableCell>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Qty</TableCell>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Amount</TableCell>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Reinvested</TableCell>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Broker</TableCell>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Pay Date</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.symbol}</TableCell>
                <TableCell>{d.ratePerShare ?? '-'}</TableCell>
                <TableCell>{d.quantity ?? '-'}</TableCell>
                <TableCell>{d.amount}</TableCell>
                <TableCell>{d.reinvested ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  {d.brokerAccountId ? (brokerLabels[d.brokerAccountId] ?? d.brokerAccountId) : '-'}
                </TableCell>
                <TableCell>{new Date(d.payDatetime).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(d)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        sx={{ '&:hover': { color: 'error.main' } }}
                        onClick={() => onDelete(d)}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!loading && rows.length === 0 && (
          <Box sx={{ p: 3, opacity: 0.8 }}>No dividends found.</Box>
        )}
        {loading && <Box sx={{ p: 3, opacity: 0.8 }}>Loading…</Box>}
      </TableContainer>

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

      <CreateDividendDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSaved={async () => {
          refresh(true);
        }}
        mode="full"
        tickers={tickerOptions}
        brokerItems={brokerItems}
        defaultBrokerAccountId={defaultBrokerAccountId}
        editingDividendId={editing?.id}
        initialValues={dialogInitialValues}
      />
    </StockShell>
  );
}
