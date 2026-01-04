import type { ChartWallQueryState } from '../../types/stock/chart.type';
import type { Bucket, Market, StockClass } from '../../types/stock/ticker.types';

function parseCsv(v: string | null) {
  if (!v) return [];
  return v.split(',').map(s => s.trim()).filter(Boolean);
}

function asPerTab(n: number): 1 | 2 | 4 | 6 | 9 | null {
  return ([1, 2, 4, 6, 9] as const).includes(n as any) ? (n as any) : null;
}
function asRotate(n: number): 10 | 20 | 30 | 40 | 50 | null {
  return ([10, 20, 30, 40, 50] as const).includes(n as any) ? (n as any) : null;
}

export function readChartWallQuery(defaults: ChartWallQueryState): ChartWallQueryState {
  const sp = new URLSearchParams(window.location.search);

  const marketParam = sp.get('market') as Market | null;
  const market: Market =
    marketParam === 'canada' || marketParam === 'usa' || marketParam === 'india'
      ? marketParam
      : defaults.market;

  const cls = sp.get('class');
  const stockClass: StockClass =
    cls === 'dividend' || cls === 'trade' || cls === 'longTerm'
      ? (cls as StockClass)
      : defaults.stockClass;

  const bucketsRaw = parseCsv(sp.get('buckets'));
  const buckets = bucketsRaw.filter((b): b is Bucket =>
    b === 'core' || b === 'watch' || b === 'once' || b === 'avoid'
  );
  const bucketsFinal = buckets.length ? buckets : defaults.buckets;

  const symbols = parseCsv(sp.get('symbols'));
  const perTab = asPerTab(Number(sp.get('perTab'))) ?? defaults.perTab;

  const rotateSec = asRotate(Number(sp.get('rotate'))) ?? defaults.rotateSec;
  const rotateOn = sp.get('rotateOn') === '1' ? true : defaults.rotateOn;

  const tabRaw = Number(sp.get('tab'));
  const tab = Number.isFinite(tabRaw) && tabRaw >= 0 ? tabRaw : defaults.tab;

  return {
    market,
    stockClass,
    buckets: bucketsFinal,
    symbols,
    perTab,
    rotateSec,
    rotateOn,
    tab,
  };
}

export function buildChartWallQueryString(state: ChartWallQueryState) {
  const sp = new URLSearchParams();
  sp.set('market', state.market);
  sp.set('class', state.stockClass);
  sp.set('buckets', state.buckets.join(','));
  if (state.symbols.length) sp.set('symbols', state.symbols.join(','));
  sp.set('perTab', String(state.perTab));
  sp.set('rotate', String(state.rotateSec));
  sp.set('rotateOn', state.rotateOn ? '1' : '0');
  sp.set('tab', String(state.tab));
  return sp.toString();
}

