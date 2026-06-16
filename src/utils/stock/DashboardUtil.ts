import type { BrokerAccountDTO } from '../../types/stock/broker-account.types';
import type { BrokerId, TickerLatestDTO } from '../../types/stock/ticker.types';

const BROKER_PRIORITY = ['Wealthsimple', 'Questrade', 'TD Canada Trust', 'Motilal Oswal'];
const ACCOUNT_TYPE_PRIORITY = ['Non-registered', 'Cash', 'TFSA', 'RRSP', 'NRO', 'NRE'];

function getBrokerQty(t: TickerLatestDTO, b: BrokerId): number {
  const q = t.positionsByBrokerAccount?.[b]?.quantityHolding;
  return typeof q === 'number' ? q : 0;
}

function accountPriority(account: BrokerAccountDTO): number {
  const brokerRank = BROKER_PRIORITY.indexOf(account.broker);
  const typeRank = ACCOUNT_TYPE_PRIORITY.indexOf(account.name);
  return (brokerRank === -1 ? 99 : brokerRank) * 10 + (typeRank === -1 ? 9 : typeRank);
}

export function pickDefaultBroker(t: TickerLatestDTO, accounts: BrokerAccountDTO[]): string {
  const posKeys = Object.keys(t.positionsByBrokerAccount ?? {});

  const withQty = accounts
    .filter((a)=>posKeys.includes(a.id) && getBrokerQty(t, a.id) > 0)
    .sort((a,b)=>accountPriority(a) - accountPriority(b));
  if(withQty.length > 0) return withQty[0].id;
  const sorted = accounts
    .filter((a) => posKeys.includes(a.id))
    .sort((a, b) => accountPriority(a) - accountPriority(b));

  if (sorted.length) return sorted[0].id;

  return posKeys[0] ?? '';
}

export function derivePositionFields(t: TickerLatestDTO, broker: BrokerId): Pick<TickerLatestDTO, 'avgBookCost'|'quantityHolding'|'totalReturn'> {
  const snap = t.positionsByBrokerAccount?.[broker];
  const avg = typeof snap?.avgBookCost === 'number' ? snap.avgBookCost : null;
  const qty = typeof snap?.quantityHolding === 'number' ? snap.quantityHolding : null;

  const last = typeof t.lastPrice === 'number' ? t.lastPrice : 0;

  let totalReturn = 0;
  if (typeof avg === 'number' && typeof qty === 'number' && qty > 0 && last > 0) {
    totalReturn = last * qty - avg * qty;
  }

  return { avgBookCost: avg, quantityHolding: qty, totalReturn };
}
