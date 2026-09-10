// Per-chart subpath: `import { ... } from "@michi-vz/react/range-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { mountRangeChart } from "@michi-vz/core";
import type {
  RangeChartProps,
  ChartInstance,
  ChartContext,
  TimelineController,
} from "@michi-vz/core";

export type { RangeChartProps } from "@michi-vz/core";

export interface RangeChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
  /** Re-run the progressiveDraw reveal animation (no-op unless the prop is set). */
  replay(): void;
  /** Headless playback controller (null unless the `timeline` prop is set). */
  timeline(): TimelineController | null;
}

export const RangeChart = forwardRef<RangeChartHandle, RangeChartProps>(
  function RangeChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<RangeChartProps> | null>(null);

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountRangeChart(hostRef.current, props);
      return () => {
        chartRef.current?.destroy();
        chartRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      chartRef.current?.update(props);
    });

    useImperativeHandle(
      ref,
      () => ({
        getContext: () => chartRef.current?.getContext() ?? null,
        getElement: () => hostRef.current,
        timeline: () => chartRef.current?.timeline?.() ?? null,
        replay: () => chartRef.current?.replay?.(),
      }),
      [],
    );

    return (
      <div ref={hostRef} style={{ width: props.width ?? 1000, height: props.height ?? 500 }} />
    );
  },
);
