import type { TickerLatestDTO } from "../../types/stock/ticker.types";

export function bucketRank(bucket: string | null | undefined): number {
  // adjust if your bucket values differ
  switch (bucket) {
    case 'core':
      return 0;
    case 'watch':
      return 1;
    case 'once':
      return 2;
    case 'avoid':
      return 3;
    default:
      return 99;
  }
}

type FavState = 'SELL_STRONG' | 'SELL' | 'BUY_STRONG' | 'BUY' | 'NONE';

function favRank(s: FavState): number {
  switch (s) {
    case 'SELL_STRONG': return 0;
    case 'SELL': return 1;
    case 'BUY_STRONG': return 2;
    case 'BUY': return 3;
    case 'NONE': return 99;
  }
}

function getFavState(t: TickerLatestDTO): FavState {
  const qty = t.quantityHolding ?? 0;
  const last = t.lastPrice ?? 0;

  const green = t.thresholdGreen ?? null;
  const cyan = t.thresholdCyan ?? null;
  const orange = t.thresholdOrange ?? null;
  const red = t.thresholdRed ?? null;

  const above = (th: number | null) => th != null && last >= th;
  const below = (th: number | null) => th != null && last <= th;

  if (qty > 0) {
    // SELL signals take precedence when holding
    if (above(green)) return 'SELL_STRONG';
    if (above(cyan)) return 'SELL';

    // by default: DO NOT treat orange/red as favorable when holding
    return 'NONE';
  }

  // qty == 0 => buy signals
  if (below(red)) return 'BUY_STRONG';
  if (below(orange)) return 'BUY';

  return 'NONE';
}

/**
 * Silence behavior:
 * - Silence should only prevent BUY signals from being treated as favorable.
 * - SELL signals should still surface even if silenced.
 */
function applySilenceToState(state: FavState, isSilenced: boolean): FavState {
  if (!isSilenced) return state;
  if (state === 'BUY' || state === 'BUY_STRONG') return 'NONE';
  return state;
}

export function compareBySort(
  a: TickerLatestDTO,
  b: TickerLatestDTO,
  sortBy: string,
  opts?: { silencedById?: Record<string, boolean> }
) {
  switch (sortBy) {
    case 'az':
      return a.symbol.localeCompare(b.symbol);
    case 'za':
      return b.symbol.localeCompare(a.symbol);
    case 'bucket': {
      const d = bucketRank(a.bucket) - bucketRank(b.bucket);
      return d !== 0 ? d : a.symbol.localeCompare(b.symbol);
    }
    case 'favorability':
    default: {
      const silenced = opts?.silencedById ?? {};
      const aState = applySilenceToState(getFavState(a), !!silenced[a.id]);
      const bState = applySilenceToState(getFavState(b), !!silenced[b.id]);

      const aFav = aState !== 'NONE';
      const bFav = bState !== 'NONE';

      // 1) Favorable above unfavorable
      if (aFav !== bFav) return aFav ? -1 : 1;

      // 2) If both favorable: SELL_STRONG, SELL, BUY_STRONG, BUY
      const sr = favRank(aState) - favRank(bState);
      if (sr !== 0) return sr;

      // 3) Within each set: bucket then A->Z
      const br = bucketRank(a.bucket) - bucketRank(b.bucket);
      if (br !== 0) return br;

      return a.symbol.localeCompare(b.symbol);
    }
  }
}

