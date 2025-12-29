import axios from 'axios';
import type { Market, StockClass } from '../../types/stock/ticker.types';

const api = axios.create({
  baseURL: import.meta.env.VITE_LOOPBACK_API_BASE_URL ?? 'http://localhost:3000',
});

export type TickerDTO = {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  stockClasses: StockClass[];
};

export type CreateTickerDTO = Omit<TickerDTO, 'id'>;
export type UpdateTickerDTO = Partial<CreateTickerDTO>;

export async function listTickers(params?: { market?: Market; stockClass?: StockClass }) {
  const res = await api.get<TickerDTO[]>('/tickers', { params });
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
