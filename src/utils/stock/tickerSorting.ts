import type { TickerLatestDTO } from "../../types/stock/ticker.types";

export function bucketRank(bucket: string | null | undefined): number {
  // adjust if your bucket values differ
  switch (bucket) {
    case 'core':
      return 0;
    case 'watch':
      return 1;
    case 'once':
      return 2;
    case 'avoid':
      return 3;
    default:
      return 99;
  }
}

export function compareBySort(a: TickerLatestDTO, b: TickerLatestDTO, sortBy: string) {
  switch (sortBy) {
    case 'az':
      return a.symbol.localeCompare(b.symbol);
    case 'za':
      return b.symbol.localeCompare(a.symbol);
    case 'bucket': {
      const d = bucketRank(a.bucket) - bucketRank(b.bucket);
      return d !== 0 ? d : a.symbol.localeCompare(b.symbol);
    }
    case 'favorability':
    default: {
      // const d = favorabilityScore(b) - favorabilityScore(a);
      // return d !== 0 ? d : a.symbol.localeCompare(b.symbol);
      return a.symbol.localeCompare(b.symbol);
    }
  }
}

