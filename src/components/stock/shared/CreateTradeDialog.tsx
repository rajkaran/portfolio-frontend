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
  Alert,
  FormHelperText,
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors]= useState<Record<string, string>>({});
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
    setErrorMsg(null);
    setErrors({});

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
    const nextErrors: Record<string, string> = {};
    // Basic validation
    if (!form.tickerId) nextErrors.tickerId = '• Ticker is required';
    if (!form.brokerAccountId?.trim()) nextErrors.brokerAccountId = '• Broker is required';

    const rateNum = Number(form.rate);
    if (!rateNum || !Number.isFinite(rateNum) || rateNum <= 0) nextErrors.rate = '• Valid Rate is required';

    const qtyNum = Number(form.quantity);
    if (!qtyNum || !Number.isFinite(qtyNum) || qtyNum <= 0) nextErrors.quantity = '• Valid Quantity is required';

    const totalAmountNum = Number(form.totalAmount);
    if (!totalAmountNum || !Number.isFinite(totalAmountNum) || totalAmountNum <= 0) nextErrors.totalAmount = '• Could not Calculate Total Amount';

    const profitNum = form.profit.trim() ? Number(form.profit) : null;
    if (!profitNum || form.profit.trim() && !Number.isFinite(profitNum!)) nextErrors.profit = '• Could not Calculate Profit';

    const feeNum = form.brokerageFee.trim() === '' ? 0 : Number(form.brokerageFee);


    const {isTrade, isDividendOrLongTerm} = getClassFlags(props.selectedClass);
    if(isTrade && !form.purpose) nextErrors.purpose = '• Purpose is required';
    if(isTrade && !form.reason) nextErrors.reason = '• Reason is required';
    if(isDividendOrLongTerm && !form.purpose) nextErrors.purpose = '• Purpose is required';

    if(Object.keys(nextErrors).length>0){
      setErrors(nextErrors);
      return;
    }

    setErrors({});

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
    } catch(e: any){
      console.error('Failed to save trade', e);
      const errorMsg = e?.response?.data?.error?.message || 
      e?.response?.data?.message || 
      e?.message || 'Failed to save trade. Please try again.';
      setErrorMsg(errorMsg);
    }finally {
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
      onChange={(v) => {
        setForm((p) => ({ ...p, tickerId: v?.id ?? '', symbol: v?.symbol ?? '' }))
        setErrors((p)=>({...p, tickerId:''}))
      }}
      label="Ticker"
      disabled={saving}
      error={!!errors.tickerId}
      helperText={errors.tickerId}
    />
  );

  // Field order controls tab order:
  // quick: Rate -> Qty first
  // full: Ticker -> Type -> Broker -> Rate -> Qty ...
  const rateField = (
    <TextField
      size="small"
      label="Rate"
      fullWidth
      value={form.rate}
      inputRef={rateRef} // <— focus for quick mode
      onChange={(e)=>{
        setForm((p)=>({ ...p, rate: e.target.value}));
        setErrors((p)=>({...p, rate:''}));
      }}
      inputProps={{ inputMode: 'decimal' }}
      error={!!errors.rate}
      helperText={errors.rate}
    />
  );

  const qtyField = (
    <TextField
      size="small"
      label="Quantity"
      fullWidth
      value={form.quantity}
      onChange={(e) => {
        setForm((p) => ({ ...p, quantity: e.target.value }))
        setErrors((p)=>({...p, quantity:''}));
      }}
      inputProps={{ inputMode: 'numeric' }}
      error={!!errors.quantity}
      helperText={errors.quantity}
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
            setErrors((p)=>({...p, profit:''}));
            if (v.trim() === '') setProfitTouched(false);
          }
        }
        inputProps={{ inputMode: 'decimal' }}
        error={!!errors.profit}
        helperText={errors.profit}
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
        setErrors((p)=>({...p, totalAmount:''}));
        // Optional: if they clear it, resume auto mode
        if (v.trim() === '') setTotalAmountTouched(false);
      }}
      inputProps={{ inputMode: 'decimal' }}
      error={!!errors.totalAmount}
      helperText={errors.totalAmount}
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
      onChange={(v) => {
        setForm((p) => ({ ...p, brokerAccountId: v }))
        setErrors((p)=>({...p, brokerAccountId:''}))
      }}
      items={props.brokerItems}
      disabled={saving}
      includeAllOption={false}
      error={!!errors.brokerAccountId}
      helperText={errors.brokerAccountId}
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
    <FormControl size="small" error={!!errors.purpose}>
      <InputLabel>Purpose</InputLabel>
      <Select
        label="Purpose"
        value={form.purpose}
        onChange={(e) => {
          setForm((p) => ({ ...p, purpose: e.target.value }))
          setErrors((p)=>({...p, purpose:''}))
        }}
      >
        {purposeItems.map((item) => (
          <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
        ))}
      </Select>
      {errors.purpose && <FormHelperText>{errors.purpose}</FormHelperText>}
    </FormControl>
  );
  
  const reasonField = (
    <FormControl size="small" error={!!errors.reason}>
      <InputLabel>Reason</InputLabel>
      <Select
        label="Reason"
        value={form.reason}
        onChange={(e) => {
          setForm((p) => ({ ...p, reason: e.target.value }))
          setErrors((p)=>({...p, reason:''}))
        }}
      >
        {reasonItems.map((item) => (
          <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
        ))}
      </Select>
      {errors.reason && <FormHelperText>{errors.reason}</FormHelperText>}
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
            {errorMsg && (
              <Alert severity='error' onClose={()=>setErrorMsg(null)}>
                {errorMsg}
              </Alert>
            )}

            {tickerField}
            {brokerField}
            {typeField}
            <Box sx={{display:'flex', gap:1.5}}>
              <Box sx={{flex:1}}>{rateField}</Box>
              <Box sx={{flex:1}}>{qtyField}</Box>
            </Box>
            {profitField}
            {totalAmountField}
            {mode==='full' && (
              <>
              {brokerageFeeField}
              {tradeDatetimeField}
              </>
            )}
            {purposeField}
            {reasonField}

            {/* Order matters for tabbing */}
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
