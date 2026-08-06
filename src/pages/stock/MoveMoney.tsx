import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
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
import { TABLE_ROWS_PER_PAGE_OPTIONS } from '../../constants/stockUI';
import { useSnackbar } from '../../components/common/SnackbarProvider';
import {
  deleteMoveMoney,
  countMoveMoney,
  listMoveMoneyPaged,
} from '../../services/stock/move-money-api';
import type { MoveMoneyDTO } from '../../types/stock/move-money.types';
import { CreateMoveMoneyDialog } from '../../components/stock/shared/CreateMoveMoneyDialog';
import { BrokerSelect } from '../../components/stock/shared/BrokerSelect';
import { OperationSelect } from '../../components/stock/shared/OperationSelect';
import { useBrokerAccounts } from '../../hooks/stock/useBrokerAccounts';
import { useStockExchanges } from '../../hooks/stock/useStockExchanges';
import { useKeyValuePairs } from '../../hooks/stock/useKeyValuePairs';
import {
  getBrokerItems,
  getBrokerLabels,
  getDefaultBrokerAccountId,
  getCurrencyItemsFromExchanges,
  getDefaultCurrencyValue,
  getOperationItems,
  getDefaultOperationValue,
} from '../../utils/stock/prepareDropdownOptions';

export default function MoveMoney() {
  const { showSnackbar } = useSnackbar();
  const { data: brokerAccounts, loading: brokerAccountsLoading } = useBrokerAccounts(true);
  const { data: stockExchanges } = useStockExchanges(true);
  const { data: keyValuePairs } = useKeyValuePairs(['moveMoneyDirection']);

  const [rows, setRows] = useState<MoveMoneyDTO[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);

  // filters
  const [filterBrokerAccountId, setFilterBrokerAccountId] = useState('all');
  const [filterOperation, setFilterOperation] = useState<string>('all');

  // dialog
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MoveMoneyDTO | null>(null);

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

  const currencyItems = useMemo(
    () => getCurrencyItemsFromExchanges(stockExchanges),
    [stockExchanges],
  );
  const defaultCurrency = useMemo(() => getDefaultCurrencyValue(currencyItems), [currencyItems]);

  const operationItems = useMemo(() => getOperationItems(keyValuePairs), [keyValuePairs]);
  const defaultOperation = useMemo(
    () => getDefaultOperationValue(operationItems),
    [operationItems],
  );

  const operationFilterItems = useMemo(
    () => [{ value: 'all', label: 'All Operations' }, ...operationItems],
    [operationItems],
  );

  const operationLabels = useMemo(
    () => Object.fromEntries(operationItems.map((o) => [o.value, o.label])),
    [operationItems],
  );

  const dialogInitialValues = useMemo(() => {
    if (!editing) return undefined;

    return {
      brokerAccountId: editing.brokerAccountId ?? defaultBrokerAccountId,
      amount: String(editing.amount ?? ''),
      currency: editing.currency ?? defaultCurrency,
      operation: editing.operation ?? defaultOperation,
      transferDatetimeIso: new Date(editing.transferDatetime).toISOString(),
    };
  }, [editing, defaultBrokerAccountId, defaultCurrency, defaultOperation]);

  const apiFilters = useMemo(
    () => ({
      brokerAccountId:
        !filterBrokerAccountId || filterBrokerAccountId === 'all'
          ? undefined
          : filterBrokerAccountId,
      operation: !filterOperation || filterOperation === 'all' ? undefined : filterOperation,
    }),
    [filterBrokerAccountId, filterOperation],
  );

  const refresh = (goFirstPage: boolean) => {
    if (goFirstPage) setPage(0);
    setRefreshKey((k) => k + 1);
  };

  // when filters change: reset to first page
  useEffect(() => {
    setPage(0);
  }, [filterBrokerAccountId, filterOperation]);

  // COUNT: only when filters change or refreshKey changes (NOT on page change)
  useEffect(() => {
    let cancelled = false;
    const reqId = ++countReqIdRef.current;

    (async () => {
      try {
        const c = await countMoveMoney(apiFilters);
        if (cancelled) return;
        if (reqId !== countReqIdRef.current) return;

        setTotalCount(c);

        const maxPage = Math.max(0, Math.ceil(c / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
      } catch (e: any) {
        if (!cancelled)
          showSnackbar(e?.message ?? 'Failed to load records count', { severity: 'error' });
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

        const mr = await listMoveMoneyPaged({
          ...apiFilters,
          limit,
          skip,
        });

        if (cancelled) return;
        if (reqId !== rowsReqIdRef.current) return;

        setRows(mr);
      } catch (e: any) {
        if (!cancelled) showSnackbar(e?.message ?? 'Failed to load records', { severity: 'error' });
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

  function openEdit(m: MoveMoneyDTO) {
    setEditing(m);
    setOpen(true);
  }

  async function onDelete(m: MoveMoneyDTO) {
    const ok = window.confirm(
      `Delete this ${operationLabels[m.operation] ?? m.operation} of ${m.amount} ${m.currency}?`,
    );
    if (!ok) return;

    try {
      await deleteMoveMoney(m.id);
      showSnackbar('Record deleted', { severity: 'success' });

      refresh(true);
    } catch (e: any) {
      showSnackbar(e?.message ?? 'Delete failed', { severity: 'error' });
    }
  }

  return (
    <StockShell>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Move Money
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => refresh(false)}>
              <RefreshOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Button variant="contained" onClick={openCreate}>
            Move Money
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
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <OperationSelect
            value={filterOperation}
            onChange={setFilterOperation}
            items={operationFilterItems}
            sx={{ minWidth: 200 }}
          />

          <BrokerSelect
            value={filterBrokerAccountId}
            onChange={setFilterBrokerAccountId}
            disabled={brokerAccountsLoading}
            items={brokerItems}
            includeAllOption
            allLabel="All Brokers"
            label="Broker"
            sx={{ minWidth: 200 }}
          />
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500, px: 1 }}>
          Showing {totalCount} {totalCount === 1 ? 'record' : 'records'}
        </Typography>
      </Box>

      {/* Records table */}
      <TableContainer sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Operation</TableCell>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Amount</TableCell>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Currency</TableCell>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Broker</TableCell>
              <TableCell sx={{ fontSize: 13, opacity: 0.8 }}>Transfer Date</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{operationLabels[m.operation] ?? m.operation}</TableCell>
                <TableCell>{m.amount}</TableCell>
                <TableCell>{m.currency}</TableCell>
                <TableCell>
                  {m.brokerAccountId ? (brokerLabels[m.brokerAccountId] ?? m.brokerAccountId) : '-'}
                </TableCell>
                <TableCell>{new Date(m.transferDatetime).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(m)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        sx={{ '&:hover': { color: 'error.main' } }}
                        onClick={() => onDelete(m)}
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

        {!loading && rows.length === 0 && <Box sx={{ p: 3, opacity: 0.8 }}>No records found.</Box>}
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
        rowsPerPageOptions={TABLE_ROWS_PER_PAGE_OPTIONS}
      />

      <CreateMoveMoneyDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSaved={async () => {
          refresh(true);
        }}
        brokerItems={brokerItems}
        currencyItems={currencyItems}
        operationItems={operationItems}
        defaultBrokerAccountId={defaultBrokerAccountId}
        defaultCurrency={defaultCurrency}
        defaultOperation={defaultOperation}
        editingMoveMoneyId={editing?.id}
        initialValues={dialogInitialValues}
      />
    </StockShell>
  );
}
