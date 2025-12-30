import axios from 'axios';
import type { Market, StockClass, Category } from '../../types/stock/ticker.types';

const api = axios.create({
  baseURL: import.meta.env.VITE_LOOPBACK_API_BASE_URL ?? 'http://localhost:3000',
});

export type TickerDTO = {
  id: string;
  symbol: string;
  companyName: string;
  market: Market;
  stockClasses: StockClass[];
  industry: string;
  bucket: Category;
};

export type CreateTickerDTO = Omit<TickerDTO, 'id'>;
export type UpdateTickerDTO = Partial<CreateTickerDTO>;

export async function listTickers(params?: { market?: Market; stockClass?: StockClass }) {
  const and: Array<Record<string, unknown>> = [];

  if (params?.market) and.push({ market: params.market });
  if (params?.stockClass) and.push({ stockClasses: params.stockClass });
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

  const res = await api.get('/tickers', {
    params: {
      filter: JSON.stringify(filter),
    },
  });

  return res.data;
}

export async function createTicker(body: CreateTickerDTO) {
  const res = await api.post<TickerDTO>('/tickers', body);
  return res.data;
}

export async function updateTicker(id: string, body: UpdateTickerDTO) {
  await api.patch(`/tickers/${id}`, body);
}

export async function deleteTicker(id: string) {
  await api.delete(`/tickers/${id}`);
}
