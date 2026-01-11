import type { BrokerId, TickerLatestDTO } from '../../types/stock/ticker.types';

function getBrokerQty(t: TickerLatestDTO, b: BrokerId): number {
  const q = t.positionsByBroker?.[b]?.quantityHolding;
  return typeof q === 'number' ? q : 0;
}

export function pickDefaultBroker(t: TickerLatestDTO, fallback: BrokerId = 'wealthsimple'): BrokerId {
  // If fallback has qty > 0, use it. Otherwise pick first broker with qty > 0. Otherwise fallback anyway.
  if (getBrokerQty(t, fallback) > 0) return fallback;

  const brokers = Object.keys(t.positionsByBroker ?? {}) as BrokerId[];
  for (const b of brokers) {
    if (getBrokerQty(t, b) > 0) return b;
  }
  return fallback;
}

export function derivePositionFields(t: TickerLatestDTO, broker: BrokerId): Pick<TickerLatestDTO, 'avgBookCost'|'quantityHolding'|'totalReturn'> {
  const snap = t.positionsByBroker?.[broker];
  const avg = typeof snap?.avgBookCost === 'number' ? snap.avgBookCost : null;
  const qty = typeof snap?.quantityHolding === 'number' ? snap.quantityHolding : null;

  const last = typeof t.lastPrice === 'number' ? t.lastPrice : 0;

  let totalReturn = 0;
  if (typeof avg === 'number' && typeof qty === 'number' && qty > 0 && last > 0) {
    totalReturn = last * qty - avg * qty;
  }

  return { avgBookCost: avg, quantityHolding: qty, totalReturn };
}
