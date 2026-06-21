import { LT_PRIORITY, TRADE_PRIORITY } from '../../constants/brokerAccountPriority';
import type { BrokerAccountDTO } from '../../types/stock/broker-account.types';
import type { TickerLatestDTO } from '../../types/stock/ticker.types';

function getBrokerPriority(account: BrokerAccountDTO, stockClass: string):number{
  const list = stockClass === 'TRADE'? TRADE_PRIORITY : LT_PRIORITY;
  const idx = list.findIndex((p)=>p.broker === account.broker && p.name === account.name);
  return idx === -1 ? 999 : idx;
}

function getBrokerQty(t: TickerLatestDTO, b: string): number {
  const q = t.positionsByBrokerAccount?.[b]?.quantityHolding;
  return typeof q === 'number' ? q : 0;
}

export function pickDefaultBroker(
  t: TickerLatestDTO, 
  accounts: BrokerAccountDTO[],
  stockClass: string = 'trade',
): string {
  const posKeys = Object.keys(t.positionsByBrokerAccount ?? {});

  const withQty = accounts
    .filter((a)=>posKeys.includes(a.id) && getBrokerQty(t, a.id) > 0)
    .sort((a,b)=>getBrokerPriority(a, stockClass) - getBrokerPriority(b, stockClass));
  if(withQty.length > 0) return withQty[0].id;

  return '';
}

export function derivePositionFields(t: TickerLatestDTO, broker: string): Pick<TickerLatestDTO, 'avgBookCost'|'quantityHolding'|'totalReturn'> {
  if (!broker){
    return { avgBookCost: 0, quantityHolding: 0, totalReturn: 0 };
  }
  const snap = t.positionsByBrokerAccount?.[broker];
  let avg = typeof snap?.avgBookCost === 'number' ? snap.avgBookCost : 0;
  const qty = typeof snap?.quantityHolding === 'number' ? snap.quantityHolding : 0;
  if(qty === 0){
    avg = 0;
  }

  const last = typeof t.lastPrice === 'number' ? t.lastPrice : 0;

  let totalReturn = 0;
  if (typeof avg === 'number' && typeof qty === 'number' && qty > 0 && last > 0) {
    totalReturn = last * qty - avg * qty;
  }

  return { avgBookCost: avg, quantityHolding: qty, totalReturn };
}
