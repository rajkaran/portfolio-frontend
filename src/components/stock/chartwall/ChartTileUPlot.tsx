import React from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export function ChartTileUPlot({
  symbol,
  getSeries,
  subscribeLatest,
  subscribeSeries,
}: {
  symbol: string;
  getSeries: (symbol: string) => { t: number[]; v: number[] } | undefined;
  subscribeLatest: (symbol: string, cb: (p: { price: number; time: string }) => void) => () => void;
  subscribeSeries: (symbol: string, cb: () => void) => () => void;
}) {
  const theme = useTheme();
  const hasFitRef = React.useRef(false);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const plotRef = React.useRef<uPlot | null>(null);
  const priceElRef = React.useRef<HTMLSpanElement | null>(null);

  // Tooltip DOM refs (no rerender)
  const tipRef = React.useRef<HTMLDivElement | null>(null);
  const tipTimeRef = React.useRef<HTMLDivElement | null>(null);
  const tipPriceRef = React.useRef<HTMLDivElement | null>(null);

  const hideTip = React.useCallback(() => {
    const tip = tipRef.current;
    if (tip) tip.style.display = 'none';
  }, []);

  const showTipAt = React.useCallback((leftPx: number, topPx: number, time: string, price: string) => {
    const tip = tipRef.current;
    if (!tip) return;

    // populate
    if (tipTimeRef.current) tipTimeRef.current.textContent = time;
    if (tipPriceRef.current) tipPriceRef.current.textContent = price;

    // position (clamp a bit so it doesn’t go off-canvas)
    tip.style.transform = `translate(${Math.max(4, leftPx)}px, ${Math.max(4, topPx)}px)`;
    tip.style.display = 'block';
  }, []);

  const applySeriesNow = React.useCallback(() => {
    const p = plotRef.current;
    if (!p) return;

    const s = getSeries(symbol);

    // Check if data exists and lengths match
    if (s && s.t && s.v && s.t.length > 0 && s.t.length === s.v.length) {
      // The 'true' argument resets the axes to fit the new data.
      // Without this, the chart might be drawing data "off-screen".
      const resetScales = !hasFitRef.current;
      p.setData([s.t, s.v] as uPlot.AlignedData, resetScales);
      if (resetScales) hasFitRef.current = true;
    }
  }, [symbol, getSeries]);

  React.useEffect(() => {
    hasFitRef.current = false;

    const root = rootRef.current;
    if (!root) return;

    // Cleanup previous chart instance
    plotRef.current?.destroy();
    root.innerHTML = '';

    // Ensure we have a real height, otherwise the canvas will be 0px tall
    const w = root.clientWidth || 400;
    const h = root.clientHeight || 220;

    const opts: uPlot.Options = {
      width: w,
      height: h,
      scales: {
        x: { time: true },
        y: { auto: true } // Let uPlot find min/max automatically
      },
      series: [
        {}, // X Series
        {
          label: symbol,
          stroke: theme.palette.secondary.main,
          width: 2,
          points: { show: false } // Change to true if data is very sparse
        },
      ],
      axes: [{}, {}],

      // Hover handling
      hooks: {
        setCursor: [
          (u) => {
            const idx = u.cursor.idx;
            if (idx == null || idx < 0) {
              hideTip();
              return;
            }

            const data = u.data as uPlot.AlignedData;
            const xs = data[0] as number[];
            const ys = data[1] as number[];
            const x = xs?.[idx];
            const y = ys?.[idx];

            if (!Number.isFinite(x) || !Number.isFinite(y)) {
              hideTip();
              return;
            }

            // uPlot time x is epoch seconds (your backend sends seconds)
            const d = new Date(x * 1000);
            const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const priceStr = `$${y.toFixed(2)}`;

            // Cursor position is relative to plot area; we can use cursor left/top.
            // Put tooltip slightly above and to the right.
            const left = (u.cursor.left ?? 0) + 10;
            const top = (u.cursor.top ?? 0) - 36;

            showTipAt(left, top, timeStr, priceStr);
          },
        ],
      },
    };

    // Initialize with whatever is available (or empty arrays)
    const initial = getSeries(symbol);
    const initialData = (initial && initial.t.length > 0)
      ? [initial.t, initial.v]
      : [[], []];

    plotRef.current = new uPlot(opts, initialData as uPlot.AlignedData, root);

    const ro = new ResizeObserver(() => {
      if (plotRef.current && rootRef.current) {
        plotRef.current.setSize({
          width: rootRef.current.clientWidth,
          height: rootRef.current.clientHeight,
        });
      }
    });
    ro.observe(root);

    // Hide tooltip when mouse leaves plot root
    const onLeave = () => hideTip();
    root.addEventListener('mouseleave', onLeave);

    return () => {
      root.removeEventListener('mouseleave', onLeave);
      ro.disconnect();
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [symbol, getSeries, theme.palette.secondary.main, hideTip, showTipAt]);

  // Handle updates from ChartWall's seriesSubsRef
  React.useEffect(() => {
    const unsub = subscribeSeries(symbol, applySeriesNow);
    applySeriesNow();
    return unsub;
  }, [symbol, subscribeSeries, applySeriesNow]);

  // Handle live price text
  React.useEffect(() => {
    return subscribeLatest(symbol, ({ price }) => {
      if (priceElRef.current) priceElRef.current.textContent = price.toFixed(2);
    });
  }, [symbol, subscribeLatest]);

  return (
    <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* header row: symbol left, price centered */}
      <Box sx={{ px: 1, py: 0.5, position: 'relative' }}>
        <Typography fontWeight={700}>{symbol}</Typography>

        <Typography
          variant="body2"
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontWeight: 500,
          }}
        >
          $<span ref={priceElRef}>—</span>
        </Typography>
      </Box>

      {/* plot area */}
      <Box sx={{ position: 'relative', flex: 1, minHeight: 220, width: '100%' }}>
        <Box ref={rootRef} sx={{ position: 'absolute', inset: 0 }} />

        {/* tooltip overlay */}
        <Box
          ref={tipRef}
          sx={{
            position: 'absolute',
            zIndex: 5,
            display: 'none',
            pointerEvents: 'none',
            bgcolor: 'rgba(0,0,0,0.75)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: 12,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
          }}
        >
          <div ref={tipTimeRef} style={{ opacity: 0.9 }} />
          <div ref={tipPriceRef} style={{ fontWeight: 700 }} />
        </Box>
      </Box>
    </Box>
  );
}
