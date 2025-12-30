import type { Market, StockClass, TickerDTO, CreateTickerDTO, UpdateTickerDTO } from '../../types/stock/ticker.types';
import { loopbackApi } from "./loopback-api";

export async function listTickers(params?: { market?: Market; stockClass?: StockClass }) {
  const and: Array<Record<string, unknown>> = [];

  if (params?.market) and.push({ market: params.market });

  if (params?.stockClass) {
    // More explicit for array fields (stockClasses is string[])
    and.push({ stockClasses: { inq: [params.stockClass] } });
  }

  and.push({ isActive: true });

  const filter = {
    order: ['symbol DESC'],
    where: and.length ? { and } : undefined,
    fields: {
      id: true,
      symbol: true,
      companyName: true,
      market: true,
      stockClasses: true,
      industry: true,
      bucket: true
    },
  };

  const res = await loopbackApi.get('/tickers', {
    params: {
      filter: JSON.stringify(filter),
    },
  });

  return res.data;
}

export async function createTicker(body: CreateTickerDTO) {
  const res = await loopbackApi.post<TickerDTO>('/tickers', body);
  return res.data;
}

export async function updateTicker(id: string, body: UpdateTickerDTO) {
  await loopbackApi.patch(`/tickers/${id}`, body);
}

export async function deleteTicker(id: string) {
  await loopbackApi.delete(`/tickers/${id}`);
}
