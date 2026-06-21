import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { BrokerPositionSnapshotDTO, TickerOption } from '../../../types/stock/ticker.types';
import type {
  CreateTradeDTO,
  TradeDialogMode,
  TradeType,
  UpdateTradeDTO,
} from '../../../types/stock/trade.types';
import { createTrade, updateTrade } from '../../../services/stock/trade-api';
import { SingleTickerSelect } from './SingleTickerSelect';
import { BrokerSelect } from './BrokerSelect';
import type { DropdownItem } from '../../../utils/stock/prepareDropdownOptions';

import { useKeyValuePairs } from '../../../hooks/stock/useKeyValuePairs';

type FormState = {
  symbol: string;
  tickerId: string;
  tradeType: TradeType;
  brokerAccountId: string;
  rate: string; // keep as string so it can be blank
  quantity: string; // same idea
  totalAmount: string; // same idea
  profit: string; // same idea
  tradeDatetimeIso: string; // ISO string or local formatted, depending on your existing picker
  brokerageFee: string; // store as string for TextField
  purpose?: string;
  reason?: string;
};

// ----- datetime helpers -----
// Convert ISO -> "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
function isoToLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// Convert "YYYY-MM-DDTHH:mm" local time -> ISO UTC
function localInputToIso(local: string): string {
  // new Date("YYYY-MM-DDTHH:mm") is treated as local time by JS
  const d = new Date(local);
  return d.toISOString();
}

function nowIso() {
  return new Date().toISOString();
}

function getClassFlags(selectedClass?: string){
  return {
    isTrade: selectedClass === 'trade',
    isDividendOrLongTerm: selectedClass === 'dividend' || selectedClass === 'longTerm',
  }
}

function resetForm(
  defaultBrokerAccountId: string,
  preset?: { tickerId?: string; type?: TradeType },
  selectedClass? :string,
): FormState {
  const {isTrade, isDividendOrLongTerm} = getClassFlags(selectedClass);
  return {
    symbol: '',
    tickerId: preset?.tickerId ?? '',
    tradeType: preset?.type ?? 'buy',
    brokerAccountId: defaultBrokerAccountId,
    rate: '',
    quantity: '1',
    totalAmount: '',
    profit: '',
    tradeDatetimeIso: nowIso(),
    brokerageFee: '0',
    purpose: isTrade?'trade' :'',
    reason: isDividendOrLongTerm? 'averagingDown' :'',
  };
}

export function CreateTradeDialog(props: {
  open: boolean;
  onClose: () => void;
  mode: TradeDialogMode;
  tickers: TickerOption[];
  brokerItems: DropdownItem[];
  defaultBrokerAccountId?: string;

  fixedTickerId?: string;
  presetType?: 'buy' | 'sell';

  editingTradeId?: string; // optional if you reuse for edit
  initialValues?: Partial<FormState>; // optional for edit

  onSaved?: () => void | Promise<void>;
  selectedClass?: string;
  positionsByBrokerAccount?: Partial<Record<string, BrokerPositionSnapshotDTO>>;
}) {
  const {
    open,
    onClose,
    mode,
    tickers,
    defaultBrokerAccountId = '',
    fixedTickerId,
    presetType,
    editingTradeId,
    initialValues,
    positionsByBrokerAccount,
    selectedClass
  } = props;

  const [saving, setSaving] = useState(false);
  const [totalAmountTouched, setTotalAmountTouched] = useState(false);

  const [profitTouched, setProfitTouched] = useState(false);

  const [form, setForm] = useState<FormState>(() =>
    resetForm(defaultBrokerAccountId|| props.brokerItems[0]?.value || '', { tickerId: fixedTickerId, type: presetType }),
  );

  // Separate local input string for datetime-local (full mode only)
  const [tradeDtLocal, setTradeDtLocal] = useState<string>(() =>
    isoToLocalInput(form.tradeDatetimeIso),
  );

  const avgBookCost = positionsByBrokerAccount?.[form.brokerAccountId]?.avgBookCost;

  // refs for focus behavior
  const tickerInputRef = useRef<HTMLInputElement | null>(null);
  const rateRef = useRef<HTMLInputElement | null>(null);

  const keyValueIds = useMemo(() => ['tradePurpose', 'tradeReason'], []);
  const { data: keyValuePairs } = useKeyValuePairs(keyValueIds);

  const purposeItems = useMemo(() =>
    keyValuePairs?.tradePurpose
      ? Object.entries(keyValuePairs.tradePurpose).map(([value, label]) => ({ value, label: label as string }))
      : [], [keyValuePairs]);

  const reasonItems = useMemo(() =>
    keyValuePairs?.tradeReason
      ? Object.entries(keyValuePairs.tradeReason).map(([value, label]) => ({ value, label: label as string }))
      : [], [keyValuePairs]);

  // When dialog opens: set up defaults + focus rules
  useEffect(() => {
    if (!open) return;

    // If editing, load initial; else reset with presets
    const next =
      editingTradeId && initialValues
        ? ({ ...resetForm(defaultBrokerAccountId, undefined, selectedClass), ...initialValues } as FormState)
        : resetForm(defaultBrokerAccountId || props.brokerItems[0]?.value, { tickerId: fixedTickerId, type: presetType }, selectedClass);

    setForm(next);
    setTradeDtLocal(isoToLocalInput(next.tradeDatetimeIso));
    setTotalAmountTouched(false);
    setProfitTouched(false);

    // Focus: quick -> rate, full -> ticker
    const t = setTimeout(() => {
      if (mode === 'quick') rateRef.current?.focus();
      else tickerInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(t);
  }, [
    open,
    mode,
    defaultBrokerAccountId,
    fixedTickerId,
    presetType,
    editingTradeId,
    initialValues,
    selectedClass
  ]);

  // Auto-compute totalAmount = rate * quantity unless user has manually edited it
  useEffect(() => {
    if (!open) return;

    // If user has manually edited totalAmount, don't override
    if (totalAmountTouched) return;

    const r = Number(form.rate);
    const q = Number(form.quantity);

    if (!Number.isFinite(r) || !Number.isFinite(q) || r <= 0 || q <= 0) return;

    const computed = r * q;

    // avoid infinite loops / noisy re-renders
    const next = computed.toFixed(2);
    if (form.totalAmount !== next) {
      setForm((p) => ({ ...p, totalAmount: next }));
    }
  }, [open, form.rate, form.quantity, totalAmountTouched]);

  useEffect(() => {
    if (!open) return;
    if (form.tradeType !== 'sell') return;
    if (profitTouched) return;
    if (avgBookCost == null) return;
  
    const r = Number(form.rate);
    const q = Number(form.quantity);
    const fee = Number(form.brokerageFee) || 0;
  
    if (!Number.isFinite(r) || !Number.isFinite(q) || r <= 0 || q <= 0) return;
  
    const computed = ((r - avgBookCost) * q) - fee;
    const next = computed.toFixed(2);
  
    if (form.profit !== next) {
      setForm((p) => ({ ...p, profit: next }));
    }
  }, [open, form.tradeType, form.rate, form.quantity, form.brokerageFee, form.brokerAccountId, profitTouched, avgBookCost]);

  // When closing: clear transient state (including fetched options in parent, if any)
  const handleClose = () => {
    onClose();
  };

  const submit = async () => {
    // Basic validation
    if (!form.tickerId) return;
    if (!form.brokerAccountId?.trim()) return;

    const rateNum = Number(form.rate);
    const qtyNum = Number(form.quantity);
    const totalAmountNum = Number(form.totalAmount);
    const profitNum = form.profit.trim() ? Number(form.profit) : null;
    const feeNum = form.brokerageFee.trim() === '' ? 0 : Number(form.brokerageFee);

    if (!Number.isFinite(rateNum) || rateNum <= 0) return;
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) return;
    if (!Number.isFinite(totalAmountNum) || totalAmountNum <= 0) return;
    if (form.profit.trim() && !Number.isFinite(profitNum!)) return;

    const {isTrade, isDividendOrLongTerm} = getClassFlags(props.selectedClass);

    if (isTrade && !form.purpose) return;
    if (isTrade && !form.reason) return;
    if (isDividendOrLongTerm && !form.purpose) return;

    const symbolToSend =
      tickers.find((t) => t.id === form.tickerId)?.symbol?.trim() || form.symbol?.trim() || '';

    const body: CreateTradeDTO = {
      symbol: symbolToSend, // server fills this based on tickerId
      tickerId: form.tickerId,
      tradeType: form.tradeType,
      brokerAccountId: form.brokerAccountId,
      rate: rateNum,
      quantity: qtyNum,
      totalAmount: totalAmountNum,
      tradeDatetime: form.tradeDatetimeIso,

      brokerageFee: Number.isFinite(feeNum) ? feeNum : 0,

      ...(form.purpose ? { purpose: form.purpose } : {}),
      ...(form.reason ? { reason: form.reason } : {}),
    };

    setSaving(true);
    try {
      if (editingTradeId) {
        await updateTrade(editingTradeId, body as UpdateTradeDTO);
      } else {
        await createTrade(body);
      }

      await props.onSaved?.();
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  // Render ticker selector:
  const fixed = (mode === 'quick' && fixedTickerId)  || !!editingTradeId;
  const tickerValue = tickers.find((t) => t.id === form.tickerId) ?? null;

  const tickerField = fixed ? (
    <TextField size="small" label="Ticker" value={tickerValue?.symbol ?? ''} disabled />
  ) : (
    <SingleTickerSelect
      tickers={tickers}
      value={tickerValue}
      onChange={(v) => setForm((p) => ({ ...p, tickerId: v?.id ?? '', symbol: v?.symbol ?? '' }))}
      label="Ticker"
      disabled={saving}
    />
  );

  // Field order controls tab order:
  // quick: Rate -> Qty first
  // full: Ticker -> Type -> Broker -> Rate -> Qty ...
  const rateField = (
    <TextField
      size="small"
      label="Rate"
      value={form.rate}
      inputRef={rateRef} // <— focus for quick mode
      onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))}
      inputProps={{ inputMode: 'decimal' }}
    />
  );

  const qtyField = (
    <TextField
      size="small"
      label="Quantity"
      value={form.quantity}
      onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
      inputProps={{ inputMode: 'numeric' }}
    />
  );

  const profitField =
    form.tradeType === 'sell' ? (
      <TextField
        size="small"
        label="Profit"
        value={form.profit}
        onChange={(e) => {
            const v = e.target.value;
            setProfitTouched(true);
            setForm((p) => ({ ...p, profit: v }));
            if (v.trim() === '') setProfitTouched(false);
          }
        }
        inputProps={{ inputMode: 'decimal' }}
      />
    ) : null;

  const totalAmountField = (
    <TextField
      size="small"
      label="Total Amount"
      value={form.totalAmount}
      onChange={(e) => {
        const v = e.target.value;
        setTotalAmountTouched(true);
        setForm((p) => ({ ...p, totalAmount: v }));
        // Optional: if they clear it, resume auto mode
        if (v.trim() === '') setTotalAmountTouched(false);
      }}
      inputProps={{ inputMode: 'decimal' }}
    />
  );

  const typeField = (
    <FormControl size="small">
      <InputLabel>Type</InputLabel>
      <Select
        label="Type"
        value={form.tradeType}
        onChange={(e) =>
          setForm((p) => ({
            ...p,
            tradeType: e.target.value as TradeType,
            profit: e.target.value === 'sell' ? p.profit : '', // clear profit if switching to buy
          }))
        }
      >
        <MenuItem value="buy">Buy</MenuItem>
        <MenuItem value="sell">Sell</MenuItem>
      </Select>
    </FormControl>
  );

  const brokerField = (
    <BrokerSelect
      value={form.brokerAccountId}
      onChange={(v) => setForm((p) => ({ ...p, brokerAccountId: v }))}
      items={props.brokerItems}
      disabled={saving}
      includeAllOption={false}
    />
  );

  const brokerageFeeField = (
    <TextField
      size="small"
      fullWidth
      label="Brokerage Fee"
      type="number"
      value={form.brokerageFee}
      onChange={(e) => setForm((p) => ({ ...p, brokerageFee: e.target.value }))}
      inputProps={{ step: '0.01' }}
    />
  );

  const purposeField = (
    <FormControl size="small">
      <InputLabel>Purpose</InputLabel>
      <Select
        label="Purpose"
        value={form.purpose}
        onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
      >
        {purposeItems.map((item) => (
          <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
  
  const reasonField = (
    <FormControl size="small">
      <InputLabel>Reason</InputLabel>
      <Select
        label="Reason"
        value={form.reason}
        onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
      >
        {reasonItems.map((item) => (
          <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const tradeDatetimeField =
    mode === 'full' ? (
      <TextField
        size="small"
        label="Trade Datetime"
        type="datetime-local"
        value={tradeDtLocal}
        onChange={(e) => {
          const nextLocal = e.target.value;
          setTradeDtLocal(nextLocal);

          // Keep ISO in form state (UTC instant)
          if (nextLocal) {
            setForm((p) => ({ ...p, tradeDatetimeIso: localInputToIso(nextLocal) }));
          }
        }}
        InputLabelProps={{ shrink: true }}
      />
    ) : null;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{editingTradeId ? 'Edit Trade' : 'Record Trade'}</DialogTitle>

      {/* form wrapper => Enter submits */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {/* Ticker always visible; fixed in quick mode */}
            {tickerField}

            {/* Order matters for tabbing */}
            {mode === 'quick' ? (
              <>
                {rateField}
                {qtyField}
                {profitField}
                {totalAmountField}
                {typeField}
                {brokerField}
                {purposeField}
                {reasonField}
                {/* quick mode intentionally hides datetime picker */}
              </>
            ) : (
              <>
                {typeField}
                {brokerField}
                {brokerageFeeField}
                {rateField}
                {qtyField}
                {profitField}
                {totalAmountField}
                {tradeDatetimeField}
                {purposeField}
                {reasonField}
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {editingTradeId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
