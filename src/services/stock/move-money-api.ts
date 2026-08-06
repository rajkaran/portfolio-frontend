import { loopbackApi } from './loopback-api';
import type {
  CreateMoveMoneyDTO,
  MoveMoneyDTO,
  UpdateMoveMoneyDTO,
} from '../../types/stock/move-money.types';

function buildWhere(params?: { brokerAccountId?: string; operation?: string }) {
  const and: Array<Record<string, any>> = [];

  if (params?.brokerAccountId) and.push({ brokerAccountId: params.brokerAccountId });
  if (params?.operation) and.push({ operation: params.operation });

  and.push({ isActive: true });

  return and.length ? { and } : undefined;
}

export async function countMoveMoney(params?: { brokerAccountId?: string; operation?: string }) {
  const where = buildWhere(params);
  const res = await loopbackApi.get<{ count: number }>('/move-money/count', {
    params: { where: JSON.stringify(where) },
  });
  return res.data.count ?? 0;
}

export async function listMoveMoneyPaged(params: {
  brokerAccountId?: string;
  operation?: string;
  limit: number;
  skip: number;
}) {
  const where = buildWhere(params);

  const filter = {
    where,
    order: ['transferDatetime DESC'],
    limit: params.limit,
    skip: params.skip,
  };

  const res = await loopbackApi.get<MoveMoneyDTO[]>('/move-money', {
    params: { filter: JSON.stringify(filter) },
  });

  return res.data ?? [];
}

export async function createMoveMoney(body: CreateMoveMoneyDTO) {
  const res = await loopbackApi.post<MoveMoneyDTO>('/move-money', body);
  return res.data;
}

export async function updateMoveMoney(id: string, body: UpdateMoveMoneyDTO) {
  await loopbackApi.patch(`/move-money/${id}`, body);
}

export async function deleteMoveMoney(id: string) {
  await loopbackApi.delete(`/move-money/${id}`);
}
