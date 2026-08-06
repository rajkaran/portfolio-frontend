import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField, Alert } from '@mui/material';
import type { CreateMoveMoneyDTO, UpdateMoveMoneyDTO } from '../../../types/stock/move-money.types';
import { createMoveMoney, updateMoveMoney } from '../../../services/stock/move-money-api';
import { BrokerSelect } from './BrokerSelect';
import { CurrencySelect } from './CurrencySelect';
import { OperationSelect } from './OperationSelect';
import type { DropdownItem } from '../../../utils/stock/prepareDropdownOptions';
import { isoToLocalInput, localInputToIso, nowIso } from '../../../utils/common/datetime';
import { extractApiErrorMessage } from '../../../utils/common/apiError';

type FormState = {
  brokerAccountId: string;
  amount: string; // keep as string so it can be blank
  currency: string;
  operation: string;
  transferDatetimeIso: string;
};

function resetForm(
  defaultBrokerAccountId: string,
  defaultCurrency: string,
  defaultOperation: string,
): FormState {
  return {
    brokerAccountId: defaultBrokerAccountId,
    amount: '',
    currency: defaultCurrency,
    operation: defaultOperation,
    transferDatetimeIso: nowIso(),
  };
}

export function CreateMoveMoneyDialog(props: {
  open: boolean;
  onClose: () => void;
  brokerItems: DropdownItem[];
  currencyItems: DropdownItem[];
  operationItems: DropdownItem[];
  defaultBrokerAccountId?: string;
  defaultCurrency?: string;
  defaultOperation?: string;

  editingMoveMoneyId?: string;
  initialValues?: Partial<FormState>;

  onSaved?: () => void | Promise<void>;
}) {
  const {
    open,
    onClose,
    brokerItems,
    currencyItems,
    operationItems,
    defaultBrokerAccountId = '',
    defaultCurrency = 'CAD',
    defaultOperation = 'deposit',
    editingMoveMoneyId,
    initialValues,
  } = props;

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormState>(() =>
    resetForm(defaultBrokerAccountId || brokerItems[0]?.value || '', defaultCurrency, defaultOperation),
  );

  const [transferDtLocal, setTransferDtLocal] = useState<string>(() =>
    isoToLocalInput(form.transferDatetimeIso),
  );

  // When dialog opens: set up defaults
  useEffect(() => {
    if (!open) return;

    const next =
      editingMoveMoneyId && initialValues
        ? ({
            ...resetForm(defaultBrokerAccountId, defaultCurrency, defaultOperation),
            ...initialValues,
          } as FormState)
        : resetForm(
            defaultBrokerAccountId || brokerItems[0]?.value || '',
            defaultCurrency,
            defaultOperation,
          );

    setForm(next);
    setTransferDtLocal(isoToLocalInput(next.transferDatetimeIso));
    setErrorMsg(null);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultBrokerAccountId, defaultCurrency, defaultOperation, editingMoveMoneyId, initialValues]);

  const handleClose = () => {
    onClose();
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};

    if (!form.brokerAccountId?.trim()) nextErrors.brokerAccountId = 'Broker is required';

    const amountNum = Number(form.amount);
    if (!form.amount.trim() || !Number.isFinite(amountNum) || amountNum <= 0)
      nextErrors.amount = 'Valid amount is required';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    const body: CreateMoveMoneyDTO = {
      brokerAccountId: form.brokerAccountId,
      amount: amountNum,
      currency: form.currency,
      operation: form.operation,
      transferDatetime: form.transferDatetimeIso,
    };

    setSaving(true);
    try {
      if (editingMoveMoneyId) {
        await updateMoveMoney(editingMoveMoneyId, body as UpdateMoveMoneyDTO);
      } else {
        await createMoveMoney(body);
      }

      await props.onSaved?.();
      handleClose();
    } catch (e: any) {
      console.error('Failed to save money movement', e);
      setErrorMsg(extractApiErrorMessage(e, 'Failed to save. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const operationField = (
    <OperationSelect
      value={form.operation}
      onChange={(v) => setForm((p) => ({ ...p, operation: v }))}
      items={operationItems}
      disabled={saving}
    />
  );

  const brokerField = (
    <BrokerSelect
      value={form.brokerAccountId}
      onChange={(v) => {
        setForm((p) => ({ ...p, brokerAccountId: v }));
        setErrors((p) => ({ ...p, brokerAccountId: '' }));
      }}
      items={brokerItems}
      disabled={saving}
      includeAllOption={false}
      error={!!errors.brokerAccountId}
      helperText={errors.brokerAccountId}
    />
  );

  const amountField = (
    <TextField
      size="small"
      label="Amount"
      fullWidth
      value={form.amount}
      onChange={(e) => {
        setForm((p) => ({ ...p, amount: e.target.value }));
        setErrors((p) => ({ ...p, amount: '' }));
      }}
      inputProps={{ inputMode: 'decimal' }}
      error={!!errors.amount}
      helperText={errors.amount}
    />
  );

  const currencyField = (
    <CurrencySelect
      value={form.currency}
      onChange={(v) => setForm((p) => ({ ...p, currency: v }))}
      items={currencyItems}
      disabled={saving}
    />
  );

  const transferDatetimeField = (
    <TextField
      size="small"
      label="Transfer Date"
      type="datetime-local"
      value={transferDtLocal}
      onChange={(e) => {
        const nextLocal = e.target.value;
        setTransferDtLocal(nextLocal);

        if (nextLocal) {
          setForm((p) => ({ ...p, transferDatetimeIso: localInputToIso(nextLocal) }));
        }
      }}
      InputLabelProps={{ shrink: true }}
    />
  );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{editingMoveMoneyId ? 'Edit Money Movement' : 'Move Money'}</DialogTitle>

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

            {operationField}
            {brokerField}

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>{amountField}</Box>
              <Box sx={{ flex: 1 }}>{currencyField}</Box>
            </Box>
            {transferDatetimeField}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {editingMoveMoneyId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
