import { loopbackApi } from './loopback-api';
import type {
  CreateDividendDTO,
  DividendDTO,
  UpdateDividendDTO,
} from '../../types/stock/dividend.types';

function buildWhere(params?: { symbols?: string[]; brokerAccountId?: string }) {
  const and: Array<Record<string, any>> = [];

  if (params?.symbols?.length) and.push({ symbol: { inq: params.symbols } });
  if (params?.brokerAccountId) and.push({ brokerAccountId: params.brokerAccountId });

  and.push({ isActive: true });

  return and.length ? { and } : undefined;
}

export async function countDividends(params?: { symbols?: string[]; brokerAccountId?: string }) {
  const where = buildWhere(params);
  const res = await loopbackApi.get<{ count: number }>('/dividends/count', {
    params: { where: JSON.stringify(where) },
  });
  return res.data.count ?? 0;
}

export async function listDividendsPaged(params: {
  symbols?: string[];
  brokerAccountId?: string;
  limit: number;
  skip: number;
}) {
  const where = buildWhere(params);

  const filter = {
    where,
    order: ['payDatetime DESC', 'createDatetime DESC'],
    limit: params.limit,
    skip: params.skip,
  };

  const res = await loopbackApi.get<DividendDTO[]>('/dividends', {
    params: { filter: JSON.stringify(filter) },
  });

  return res.data ?? [];
}

export async function createDividend(body: CreateDividendDTO) {
  const res = await loopbackApi.post<DividendDTO>('/dividends', body);
  return res.data;
}

export async function updateDividend(id: string, body: UpdateDividendDTO) {
  await loopbackApi.patch(`/dividends/${id}`, body);
}

export async function deleteDividend(id: string) {
  await loopbackApi.delete(`/dividends/${id}`);
}
