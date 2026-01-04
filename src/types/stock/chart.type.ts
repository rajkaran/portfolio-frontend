import type { Bucket, Market, StockClass } from "./ticker.types";

export type PerTab = 1 | 2 | 4 | 6 | 9;
export type RotateSec = 10 | 20 | 30 | 40 | 50;

export type ChartSeriesResponse = {
  day: string;
  timezone: string;
  intervalSec: number; // 30
  series: Array<{ symbol: string; t: number[]; v: number[] }>;
};

export type ChartWallQueryState = {
  market: Market;
  stockClass: StockClass;        // no "all"
  buckets: Bucket[];             // multi, no "all"
  symbols: string[];
  perTab: PerTab;
  rotateSec: RotateSec;
  rotateOn: boolean;
  tab: number;
};

export type Latest = { price: number; time: string };
