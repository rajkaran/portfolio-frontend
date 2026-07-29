import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import type { TickerOption } from '../../../types/stock/ticker.types';
import type {
  CreateDividendDTO,
  DividendDialogMode,
  UpdateDividendDTO,
} from '../../../types/stock/dividend.types';
import { createDividend, updateDividend } from '../../../services/stock/dividend-api';
import { SingleTickerSelect } from './SingleTickerSelect';
import { BrokerSelect } from './BrokerSelect';
import type { DropdownItem } from '../../../utils/stock/prepareDropdownOptions';
import { isoToLocalInput, localInputToIso, nowIso } from '../../../utils/common/datetime';
import { extractApiErrorMessage } from '../../../utils/common/apiError';
import { resolveTickerSymbol } from '../../../utils/stock/resolveTickerSymbol';

type FormState = {
  symbol: string;
  tickerId: string;
  brokerAccountId: string;
  ratePerShare: string; // keep as string so it can be blank
  quantity: string;
  amount: string;
  reinvested: boolean;
  payDatetimeIso: string;
};

function resetForm(defaultBrokerAccountId: string, preset?: { tickerId?: string }): FormState {
  return {
    symbol: '',
    tickerId: preset?.tickerId ?? '',
    brokerAccountId: defaultBrokerAccountId,
    ratePerShare: '',
    quantity: '',
    amount: '',
    reinvested: false,
    payDatetimeIso: nowIso(),
  };
}

export function CreateDividendDialog(props: {
  open: boolean;
  onClose: () => void;
  mode: DividendDialogMode;
  tickers: TickerOption[];
  brokerItems: DropdownItem[];
  defaultBrokerAccountId?: string;

  fixedTickerId?: string;

  editingDividendId?: string;
  initialValues?: Partial<FormState>;

  onSaved?: () => void | Promise<void>;
}) {
  const {
    open,
    onClose,
    mode,
    tickers,
    defaultBrokerAccountId = '',
    fixedTickerId,
    editingDividendId,
    initialValues,
  } = props;

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [amountTouched, setAmountTouched] = useState(false);

  const [form, setForm] = useState<FormState>(() =>
    resetForm(defaultBrokerAccountId || props.brokerItems[0]?.value || '', {
      tickerId: fixedTickerId,
    }),
  );

  const [payDtLocal, setPayDtLocal] = useState<string>(() => isoToLocalInput(form.payDatetimeIso));

  const tickerInputRef = useRef<HTMLInputElement | null>(null);

  // When dialog opens: set up defaults
  useEffect(() => {
    if (!open) return;

    const next =
      editingDividendId && initialValues
        ? ({
            ...resetForm(defaultBrokerAccountId),
            ...initialValues,
          } as FormState)
        : resetForm(defaultBrokerAccountId || props.brokerItems[0]?.value, {
            tickerId: fixedTickerId,
          });

    setForm(next);
    setPayDtLocal(isoToLocalInput(next.payDatetimeIso));
    setAmountTouched(false);
    setErrorMsg(null);
    setErrors({});

    const t = setTimeout(() => {
      if (mode === 'full') tickerInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, defaultBrokerAccountId, fixedTickerId, editingDividendId, initialValues]);

  // Auto-compute amount = ratePerShare * quantity unless user has manually edited it
  useEffect(() => {
    if (!open) return;
    if (amountTouched) return;

    const r = Number(form.ratePerShare);
    const q = Number(form.quantity);

    if (!Number.isFinite(r) || !Number.isFinite(q) || r <= 0 || q <= 0) return;

    const computed = (r * q).toFixed(2);
    if (form.amount !== computed) {
      setForm((p) => ({ ...p, amount: computed }));
    }
  }, [open, form.ratePerShare, form.quantity, amountTouched]);

  const handleClose = () => {
    onClose();
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};

    if (!form.tickerId) nextErrors.tickerId = 'Ticker is required';
    if (!form.brokerAccountId?.trim()) nextErrors.brokerAccountId = 'Broker is required';

    const amountNum = Number(form.amount);
    if (!amountNum || !Number.isFinite(amountNum) || amountNum <= 0)
      nextErrors.amount = 'Valid Amount is required';

    const rateNum = form.ratePerShare.trim() ? Number(form.ratePerShare) : undefined;
    if (form.ratePerShare.trim() && (!Number.isFinite(rateNum!) || rateNum! <= 0))
      nextErrors.ratePerShare = 'Rate must be a valid number';

    const qtyNum = form.quantity.trim() ? Number(form.quantity) : undefined;
    if (form.quantity.trim() && (!Number.isFinite(qtyNum!) || qtyNum! <= 0))
      nextErrors.quantity = 'Quantity must be a valid number';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    const symbolToSend = resolveTickerSymbol(tickers, form.tickerId, form.symbol);

    const body: CreateDividendDTO = {
      symbol: symbolToSend,
      tickerId: form.tickerId,
      brokerAccountId: form.brokerAccountId,
      amount: amountNum,
      ...(rateNum != null ? { ratePerShare: rateNum } : {}),
      ...(qtyNum != null ? { quantity: qtyNum } : {}),
      reinvested: form.reinvested,
      payDatetime: form.payDatetimeIso,
    };

    setSaving(true);
    try {
      if (editingDividendId) {
        await updateDividend(editingDividendId, body as UpdateDividendDTO);
      } else {
        await createDividend(body);
      }

      await props.onSaved?.();
      handleClose();
    } catch (e: any) {
      console.error('Failed to save dividend', e);
      setErrorMsg(extractApiErrorMessage(e, 'Failed to save dividend. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const fixed = (mode === 'quick' && fixedTickerId) || !!editingDividendId;
  const tickerValue = tickers.find((t) => t.id === form.tickerId) ?? null;

  const tickerField = fixed ? (
    <TextField size="small" label="Ticker" value={tickerValue?.symbol ?? ''} disabled />
  ) : (
    <SingleTickerSelect
      tickers={tickers}
      value={tickerValue}
      onChange={(v) => {
        setForm((p) => ({ ...p, tickerId: v?.id ?? '', symbol: v?.symbol ?? '' }));
        setErrors((p) => ({ ...p, tickerId: '' }));
      }}
      label="Ticker"
      disabled={saving}
      error={!!errors.tickerId}
      helperText={errors.tickerId}
    />
  );

  const brokerField = (
    <BrokerSelect
      value={form.brokerAccountId}
      onChange={(v) => {
        setForm((p) => ({ ...p, brokerAccountId: v }));
        setErrors((p) => ({ ...p, brokerAccountId: '' }));
      }}
      items={props.brokerItems}
      disabled={saving}
      includeAllOption={false}
      error={!!errors.brokerAccountId}
      helperText={errors.brokerAccountId}
    />
  );

  const rateField = (
    <TextField
      size="small"
      label="Rate / Share"
      fullWidth
      value={form.ratePerShare}
      onChange={(e) => {
        setForm((p) => ({ ...p, ratePerShare: e.target.value }));
        setErrors((p) => ({ ...p, ratePerShare: '' }));
      }}
      inputProps={{ inputMode: 'decimal' }}
      error={!!errors.ratePerShare}
      helperText={errors.ratePerShare}
    />
  );

  const qtyField = (
    <TextField
      size="small"
      label="Quantity"
      fullWidth
      value={form.quantity}
      onChange={(e) => {
        setForm((p) => ({ ...p, quantity: e.target.value }));
        setErrors((p) => ({ ...p, quantity: '' }));
      }}
      inputProps={{ inputMode: 'numeric' }}
      error={!!errors.quantity}
      helperText={errors.quantity}
    />
  );

  const amountField = (
    <TextField
      size="small"
      label="Amount"
      value={form.amount}
      onChange={(e) => {
        const v = e.target.value;
        setAmountTouched(true);
        setForm((p) => ({ ...p, amount: v }));
        setErrors((p) => ({ ...p, amount: '' }));
        if (v.trim() === '') setAmountTouched(false);
      }}
      inputProps={{ inputMode: 'decimal' }}
      error={!!errors.amount}
      helperText={errors.amount}
    />
  );

  const reinvestedField = (
    <FormControlLabel
      control={
        <Checkbox
          checked={form.reinvested}
          onChange={(e) => setForm((p) => ({ ...p, reinvested: e.target.checked }))}
        />
      }
      label="Reinvested (DRIP)"
    />
  );

  const payDatetimeField =
    mode === 'full' ? (
      <TextField
        size="small"
        label="Pay Date"
        type="datetime-local"
        value={payDtLocal}
        onChange={(e) => {
          const nextLocal = e.target.value;
          setPayDtLocal(nextLocal);

          if (nextLocal) {
            setForm((p) => ({ ...p, payDatetimeIso: localInputToIso(nextLocal) }));
          }
        }}
        InputLabelProps={{ shrink: true }}
      />
    ) : null;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{editingDividendId ? 'Edit Dividend' : 'Record Dividend'}</DialogTitle>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {errorMsg && (
              <Alert severity="error" onClose={() => setErrorMsg(null)}>
                {errorMsg}
              </Alert>
            )}

            {tickerField}
            {brokerField}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>{rateField}</Box>
              <Box sx={{ flex: 1 }}>{qtyField}</Box>
            </Box>
            {amountField}
            {reinvestedField}
            {payDatetimeField}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {editingDividendId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
