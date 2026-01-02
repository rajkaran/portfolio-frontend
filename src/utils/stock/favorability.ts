import type { TickerLatestDTO } from '../../types/stock/ticker.types';

export function favorabilityScore(t: TickerLatestDTO): number {
  // placeholder: later you’ll plug your real scoring rules
  // Example: prefer "core", then "watch", then "once", then "avoid"
  const categoryScore =
    t.bucket === 'core' ? 100 : t.bucket === 'watch' ? 70 : t.bucket === 'once' ? 40 : 0;

  return categoryScore;
}
