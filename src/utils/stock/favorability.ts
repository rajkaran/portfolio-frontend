import type { TickerSnapshot } from '../../types/stock/ticker.types';

export function favorabilityScore(t: TickerSnapshot): number {
  // placeholder: later you’ll plug your real scoring rules
  // Example: prefer "core", then "watch", then "once", then "avoid"
  const categoryScore =
    t.category === 'core' ? 100 : t.category === 'watch' ? 70 : t.category === 'once' ? 40 : 0;

  return categoryScore;
}
