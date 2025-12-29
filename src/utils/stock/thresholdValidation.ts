import type { ThresholdKey } from '../../constants/stockUI';

export type Thresholds = Record<ThresholdKey, number>;

export type ValidationResult = {
  ok: boolean;
  errors: Partial<Record<ThresholdKey, string>>;
};

const MIN_RED = 0.01; // your stated floor

function isValidNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

export function validateThresholds(t: Partial<Thresholds>): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  const keys: ThresholdKey[] = [
    'thresholdGreen',
    'thresholdCyan',
    'thresholdOrange',
    'thresholdRed',
  ];

  // Base rules
  for (const k of keys) {
    const v = t[k];

    if (!isValidNumber(v)) {
      errors[k] = 'Required';
      continue;
    }
    if (v === 0) {
      errors[k] = 'Must not be 0';
      continue;
    }
    if (v < 0) {
      errors[k] = 'Must be positive';
      continue;
    }
  }

  const G = t.thresholdGreen;
  const C = t.thresholdCyan;
  const O = t.thresholdOrange;
  const R = t.thresholdRed;

  if ([G, C, O, R].every(isValidNumber)) {
    // Ordering rules: red < orange < cyan < green
    if (!(G! > C!)) {
      errors.thresholdGreen = errors.thresholdGreen ?? 'Must be greater than Cyan';
      errors.thresholdCyan = errors.thresholdCyan ?? 'Must be less than Green';
    }
    if (!(C! > O!)) {
      errors.thresholdCyan = errors.thresholdCyan ?? 'Must be greater than Orange';
      errors.thresholdOrange = errors.thresholdOrange ?? 'Must be less than Cyan';
    }
    if (!(O! > R!)) {
      errors.thresholdOrange = errors.thresholdOrange ?? 'Must be greater than Red';
      errors.thresholdRed = errors.thresholdRed ?? 'Must be less than Orange';
    }

    // Red floor: 0.01 < red
    if (!(R! >= MIN_RED)) {
      errors.thresholdRed = `Must be greater than ${MIN_RED.toFixed(2)}`;
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateThresholdEdit(
  current: Thresholds,
  key: ThresholdKey,
  nextValue: number,
): ValidationResult {
  return validateThresholds({ ...current, [key]: nextValue });
}
