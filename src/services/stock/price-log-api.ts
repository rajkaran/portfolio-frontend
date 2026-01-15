import { loopbackApi } from './loopback-api';
import type { Market } from '../../types/stock/ticker.types';
import type { ChartSeriesResponse } from '../../types/stock/chart.type';

export async function fetchChartSeries(params: {
  market: Market;
  symbols: string[];
  field?: 'last' | 'bid' | 'ask';
}) {
  const res = await loopbackApi.get<ChartSeriesResponse>('/regular-price-update-logs/chart', {
    params: {
      market: params.market,
      symbols: params.symbols.join(','),
      field: params.field ?? 'last',
    },
  });
  return res.data;
}
