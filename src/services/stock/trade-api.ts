import { loopbackApi } from './loopback-api';
import type { CreateTradeDTO, TradeDTO, TradeType, UpdateTradeDTO } from '../../types/stock/trade.types';

function buildWhere(params?: { symbols?: string[]; tradeType?: TradeType; brokerAccountId?: string }) {
  const and: Array<Record<string, any>> = [];

  if (params?.symbols?.length) and.push({ symbol: { inq: params.symbols } });
  if (params?.tradeType) and.push({ tradeType: params.tradeType });
  if (params?.brokerAccountId) and.push({ broker: params.brokerAccountId });

  and.push({ isActive: true });

  return and.length ? { and } : undefined;
}

export async function countTrades(params?: { symbols?: string[]; tradeType?: TradeType; brokerAccountId?: string }) {
  const where = buildWhere(params);
  const res = await loopbackApi.get<{ count: number }>('/trades/count', {
    params: { where: JSON.stringify(where) },
  });
  return res.data.count ?? 0;
}

// ✅ NEW: server-paginated
export async function listTradesPaged(params: {
  symbols?: string[];
  tradeType?: TradeType;
  brokerAccountId?: string;
  limit: number;
  skip: number;
}) {
  const where = buildWhere(params);

  const filter = {
    where,
    order: ['tradeDatetime DESC', 'createDatetime DESC'],
    limit: params.limit,
    skip: params.skip,
  };

  const res = await loopbackApi.get<TradeDTO[]>('/trades', {
    params: { filter: JSON.stringify(filter) },
  });

  return res.data ?? [];
}

// You can keep your old listTrades if other screens still use it,
// but Trade.tsx should use listTradesPaged + countTrades.
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
