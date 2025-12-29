import { Box, Typography } from '@mui/material';
import { useState, useRef, useMemo, useEffect } from 'react';

import { useSnackbar } from '../../common/SnackbarProvider';
import type { Thresholds } from '../../../utils/stock/thresholdValidation';
import { validateThresholdEdit } from '../../../utils/stock/thresholdValidation';
import { getThresholdColor, isThresholdKey, labelSide } from '../../../constants/stockUI';
import type { ThresholdKey } from '../../../constants/stockUI';

type Props = {
  currentPrice: number;
  thresholds: Array<{ key: string; value?: number | null }>;
  height?: number;
  showLabels?: boolean;
  onChangeThreshold?: (key: ThresholdKey, value: number) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fmt(v: number) {
  return v.toFixed(2);
}

export default function ThresholdMini({
  currentPrice,
  thresholds,
  height = 88,
  showLabels = true,
  onChangeThreshold
}: Props) {

  // Only use numeric thresholds for scaling (ignore any undefined/null)
  const numeric = thresholds
    .filter((t) => typeof t.value === 'number')
    .map((t) => t.value as number);

  const { showSnackbar } = useSnackbar();

  const [editingKey, setEditingKey] = useState<ThresholdKey | null>(null);
  const [draft, setDraft] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const valueByKey = useMemo(() => {
    const map = new Map<string, number>();
    thresholds.forEach((t) => {
      if (typeof t.value === 'number') map.set(t.key, t.value);
    });
    return map;
  }, [thresholds]);

  useEffect(() => {
    if (!editingKey) return;

    const current = valueByKey.get(editingKey);
    setDraft(typeof current === 'number' ? current.toFixed(2) : '');

    setTimeout(() => inputRef.current?.focus(), 0);
  }, [editingKey, valueByKey]);

  if (numeric.length === 0) {
    return (
      <Box
        sx={{
          height,
          bgcolor: '#f7f7f7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
        }}
      >
        No thresholds
      </Box>
    );
  }


  const green = valueByKey.get('thresholdGreen');
  const red = valueByKey.get('thresholdRed');

  // Fallback: if green/red missing, keep your old auto-fit behavior
  const hasAnchors = typeof green === 'number' && typeof red === 'number';

  const topPadPx = 10;    // space above green line
  const bottomPadPx = 10; // space below red line
  const usablePx = Math.max(1, height - topPadPx - bottomPadPx);

  let minAnchor = 0;
  let maxAnchor = 1;

  if (hasAnchors) {
    // IMPORTANT: smaller y means "higher" on screen
    // Values: higher price should be higher on screen.
    maxAnchor = Math.max(green!, red!);
    minAnchor = Math.min(green!, red!);
  } else {
    // fallback to existing behavior
    maxAnchor = Math.max(...numeric, currentPrice);
    minAnchor = Math.min(...numeric, currentPrice);
  }

  // Add VALUE padding beyond anchors (so cyan/orange don't stick to edges)
  const valueRange = Math.max(1e-9, maxAnchor - minAnchor);
  const valuePad = valueRange * 0.10; // 10% extra space above/below
  const hi = maxAnchor + valuePad;
  const lo = minAnchor - valuePad;
  const range = hi - lo;

  const yFor = (v: number) => {
    // Convert value to 0..1 where 0 is top (hi) and 1 is bottom (lo)
    const t = (hi - v) / range;

    // Convert to pixel y within the padded region
    const y = topPadPx + t * usablePx;

    // Clamp so extreme out-of-range values still show at the extremes
    return clamp(y, topPadPx, height - bottomPadPx);
  };

  // Build list of lines (excluding the "T3=currentPrice" fake threshold if present)
  const lines: Array<{ key: ThresholdKey; value: number; y: number }> = thresholds
    .filter((t) => typeof t.value === 'number')
    .filter((t) => isThresholdKey(t.key))
    .map((t) => ({
      key: t.key as ThresholdKey,
      value: t.value as number,
      y: yFor(t.value as number),
    }))
    .sort((a, b) => a.y - b.y);

  const currentThresholds: Thresholds | null = useMemo(() => {
    const g = valueByKey.get('thresholdGreen');
    const c = valueByKey.get('thresholdCyan');
    const o = valueByKey.get('thresholdOrange');
    const r = valueByKey.get('thresholdRed');

    if ([g, c, o, r].every((v) => typeof v === 'number')) {
      return {
        thresholdGreen: g as number,
        thresholdCyan: c as number,
        thresholdOrange: o as number,
        thresholdRed: r as number,
      };
    }

    return null;
  }, [valueByKey]);


  const inset = 10;
  const currentY = yFor(currentPrice);

  const commit = () => {
    if (!editingKey) return;

    const n = Number(draft);

    // Always exit edit mode on commit attempt
    const key = editingKey;
    setEditingKey(null);

    if (!Number.isFinite(n) || n === 0) {
      showSnackbar('Invalid value. Please enter a number greater than 0.', { severity: 'error' });
      return;
    }

    if (!currentThresholds) {
      showSnackbar('Thresholds not ready to validate yet.', { severity: 'error' });
      return;
    }

    const result = validateThresholdEdit(currentThresholds, key, n);

    if (!result.ok) {
      showSnackbar(result.errors[key] ?? 'Invalid threshold value.', { severity: 'error' });
      return;
    }

    onChangeThreshold?.(key, n);
  };


  const cancel = () => {
    setEditingKey(null);
  };

  return (
    <Box
      sx={{
        height,
        borderRadius: 0,
        bgcolor: '#f7f7f7',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Threshold lines */}
      {lines.map((l) => (
        <Box key={l.key}>
          {/* the line */}
          <Box
            sx={{
              position: 'absolute',
              left: inset,
              right: inset,
              top: l.y,
              transform: 'translateY(-50%)', // center the 2px line on y
              height: 2,
              bgcolor: getThresholdColor(l.key),
              opacity: 0.9,
              zIndex: 1,
            }}
          />

          {/* the label (separate from the line) */}
          {showLabels ? (
            <Box
              sx={{
                position: 'absolute',
                top: l.y,
                transform: 'translateY(-50%)',
                ...(labelSide(l.key) === 'left'
                  ? { left: inset, pr: 0.5 }
                  : { right: inset, pl: 0.5 }),
                bgcolor: '#f7f7f7',
                display: 'inline-flex',
                alignItems: 'center',
                zIndex: 3,
              }}
              onDoubleClick={() => setEditingKey(l.key)}
            >
              {editingKey === l.key ? (
                <Box
                  component="input"
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') cancel();
                  }}
                  sx={{
                    fontSize: 10,
                    lineHeight: 1,
                    width: 54,
                    padding: '2px 4px',
                    borderRadius: 1,
                    border: '1px solid rgba(0,0,0,0.35)',
                    outline: 'none',
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    textAlign: labelSide(l.key) === 'right' ? 'right' : 'left',
                    zIndex: 3
                  }}
                />
              ) : (
                <Typography variant="caption" sx={{ fontSize: 10, lineHeight: 1 }}>
                  {fmt(l.value)}
                </Typography>
              )}
            </Box>
          ) : null}
        </Box>
      ))}


      {/* Current price marker */}
      <Box
        sx={{
          position: 'absolute',
          left: inset,
          right: inset,
          top: currentY,
          transform: 'translateY(-50%)',
          height: 2,
          bgcolor: '#000',
          zIndex: 2,
        }}
      />

      {/* Current price label on right */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          left: '50%',           // center horizontally
          top: currentY,         // anchor to the line
          transform: 'translate(-50%, -50%)', // center on both axes
          fontSize: 10,
          lineHeight: 1,
          bgcolor: '#f7f7f7',
          px: 0.5,
          zIndex: 4
        }}
      >
        {currentPrice.toFixed(2)}
      </Typography>
    </Box>
  );
}
