import { loopbackApi } from './loopback-api';
import type { CreateTradeDTO, TradeDTO, UpdateTradeDTO } from '../../types/stock/trade.types';

export async function listTrades(params?: { tickerId?: string; tradeType?: 'buy' | 'sell'; q?: string }) {
  const and: Array<Record<string, any>> = [];

  if (params?.tickerId) and.push({ tickerId: params.tickerId });
  if (params?.tradeType) and.push({ tradeType: params.tradeType });

  // crude search: symbol OR broker contains
  // (LoopBack Mongo "like" works; if not, remove this part)
  if (params?.q?.trim()) {
    const q = params.q.trim();
    and.push({
      or: [
        { symbol: { like: q, options: 'i' } },
        { broker: { like: q, options: 'i' } },
      ],
    });
  }

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
