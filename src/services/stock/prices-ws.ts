import type { PriceUpdateDTO } from '../../types/stock/price-update.types';

type Msg =
  | { type: 'hello'; data: any }
  | { type: 'priceUpdate'; data: PriceUpdateDTO };

export function connectPricesWs(opts: {
  onPriceUpdate: (u: PriceUpdateDTO) => void;
  onStatus?: (s: { connected: boolean }) => void;
}) {
  const base = import.meta.env.VITE_LOOPBACK_API_BASE_URL ?? 'http://localhost:3000';
  const wsUrl = base.replace(/^http/, 'ws') + '/ws/prices';

  let ws: WebSocket | null = null;
  let closedByUser = false;
  let retryTimer: number | null = null;

  const cleanupRetry = () => {
    if (retryTimer != null) window.clearTimeout(retryTimer);
    retryTimer = null;
  };

  const connect = () => {
    cleanupRetry();
    ws = new WebSocket(wsUrl);

    ws.onopen = () => opts.onStatus?.({ connected: true });

    ws.onclose = () => {
      opts.onStatus?.({ connected: false });
      if (!closedByUser) {
        retryTimer = window.setTimeout(connect, 2000);
      }
    };

    ws.onerror = () => {
      // force close -> triggers reconnect
      try { ws?.close(); } catch { }
    };

    ws.onmessage = (ev) => {
      try {
        const msg: Msg = JSON.parse(ev.data);
        if (msg.type === 'priceUpdate') opts.onPriceUpdate(msg.data);
      } catch {
        // ignore junk
      }
    };
  };

  connect();

  return {
    close: () => {
      closedByUser = true;
      cleanupRetry();
      try { ws?.close(); } catch { }
    },
  };
}
