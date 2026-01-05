import { loopbackApi } from './loopback-api';
import type { Broker, CreateTradeDTO, TradeDTO, TradeType, UpdateTradeDTO } from '../../types/stock/trade.types';

export async function listTrades(params?: { symbols?: string[]; tradeType?: TradeType; broker?: Broker }) {
  const and: Array<Record<string, any>> = [];

  // filter by symbol (human expectation)
  if (params?.symbols?.length) and.push({ symbol: { inq: params.symbols } });

  if (params?.tradeType) and.push({ tradeType: params.tradeType });

  // broker is dropdown now: exact match (not "like")
  if (params?.broker) and.push({ broker: params.broker });

  and.push({ isActive: true });

  const filter = {
    where: and.length ? { and } : undefined,
    order: ['tradeDatetime DESC', 'createDatetime DESC'],
    limit: 500,
  };

  const res = await loopbackApi.get<TradeDTO[]>('/trades', {
    params: { filter: JSON.stringify(filter) },
  });

  return res.data;
}

export async function createTrade(body: CreateTradeDTO) {
  const res = await loopbackApi.post<TradeDTO>('/trades', body);
  return res.data;
}

export async function updateTrade(id: string, body: UpdateTradeDTO) {
  await loopbackApi.patch(`/trades/${id}`, body);
}

export async function deleteTrade(id: string) {
  await loopbackApi.delete(`/trades/${id}`);
}
