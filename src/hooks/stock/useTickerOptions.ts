import { useEffect, useState } from "react";
import { getTickerOptions, type TickerOptionsDTO } from "../../services/stock/meta-api";
import { useSnackbar } from "../../components/common/SnackbarProvider";

// Simple module cache (survives route changes)
let cache: TickerOptionsDTO | null = null;
let inflight: Promise<TickerOptionsDTO> | null = null;

export function useTickerOptions(enabled = true) {
  const { showSnackbar } = useSnackbar();
  const [data, setData] = useState<TickerOptionsDTO | null>(cache);
  const [loading, setLoading] = useState<boolean>(enabled && !cache);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(!cache);

        if (cache) {
          setData(cache);
          setLoading(false);
          return;
        }

        inflight = inflight ?? getTickerOptions();
        const result = await inflight;

        cache = result;
        inflight = null;

        if (!cancelled) setData(result);
      } catch (e) {
        inflight = null;
        if (!cancelled) {
          showSnackbar("Failed to load ticker options", { severity: "error" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, showSnackbar]);

  return { options: data, loading };
}
