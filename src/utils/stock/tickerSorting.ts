import type { SortBy, TickerLatestDTO } from "../../types/stock/ticker.types";

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

type FavState =
  | "HOLD_GREEN"
  | "HOLD_CYAN"
  | "Q0_RED"
  | "HOLD_RED"
  | "HOLD_ORANGE"
  | "Q0_ORANGE"
  | "NONE";

function favRank(s: FavState): number {
  // lower = higher priority
  switch (s) {
    case "HOLD_GREEN": return 0;
    case "HOLD_CYAN": return 1;
    case "Q0_RED": return 2;
    case "HOLD_RED": return 3;
    case "HOLD_ORANGE": return 4;
    case "Q0_ORANGE": return 5;
    case "NONE": return 99;
  }
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function getFavState(
  t: TickerLatestDTO,
  opts?: { silencedBuy?: boolean }
): FavState {
  const qty = num(t.quantityHolding) ?? 0;
  const last = num(t.lastPrice) ?? 0;

  const green = num(t.thresholdGreen);
  const cyan = num(t.thresholdCyan);
  const orange = num(t.thresholdOrange);
  const red = num(t.thresholdRed);

  const above = (th: number | null) => th != null && last >= th;
  const below = (th: number | null) => th != null && last <= th;

  // --- HOLDING: any threshold hit makes it favorable, but order matters ---
  if (qty > 0) {
    if (above(green)) return "HOLD_GREEN";
    if (above(cyan)) return "HOLD_CYAN";
    if (below(red)) return opts?.silencedBuy ? "NONE" : "HOLD_RED";
    if (below(orange)) return opts?.silencedBuy ? "NONE" : "HOLD_ORANGE";
    return "NONE";
  }

  // --- qty == 0: only orange/red make it favorable (buy zone) ---
  if (below(red)) return opts?.silencedBuy ? "NONE" : "Q0_RED";
  if (below(orange)) return opts?.silencedBuy ? "NONE" : "Q0_ORANGE";
  return "NONE";
}

export function compareBySort(
  a: TickerLatestDTO,
  b: TickerLatestDTO,
  sortBy: SortBy,
  opts?: { silencedById?: Record<string, boolean> }
) {
  switch (sortBy) {
    case "az":
      return a.symbol.localeCompare(b.symbol);

    case "za":
      return b.symbol.localeCompare(a.symbol);

    case "bucket": {
      const d = bucketRank(a.bucket) - bucketRank(b.bucket);
      return d !== 0 ? d : a.symbol.localeCompare(b.symbol);
    }

    case "favorability":
    default: {
      const silenced = opts?.silencedById ?? {};
      const aState = getFavState(a, { silencedBuy: !!silenced[a.id] });
      const bState = getFavState(b, { silencedBuy: !!silenced[b.id] });

      const aFav = aState !== "NONE";
      const bFav = bState !== "NONE";

      // 1) Favorable group first
      if (aFav !== bFav) return aFav ? -1 : 1;

      // 2) If both favorable: precedence ladder
      const pr = favRank(aState) - favRank(bState);
      if (pr !== 0) return pr;

      // 3) tie-break: bucket then A->Z
      const br = bucketRank(a.bucket) - bucketRank(b.bucket);
      if (br !== 0) return br;

      return a.symbol.localeCompare(b.symbol);
    }
  }
}

export function isFavorable(
  t: TickerLatestDTO,
  opts?: { silencedBuy?: boolean }
) {
  return getFavState(t, opts) !== "NONE";
}
