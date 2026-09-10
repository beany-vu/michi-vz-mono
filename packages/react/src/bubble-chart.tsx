// Per-chart subpath: `import { ... } from "@michi-vz/react/bubble-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { mountBubbleChart } from "@michi-vz/core";
import type {
  BubbleChartProps,
  ChartInstance,
  ChartContext,
  TimelineController,
} from "@michi-vz/core";

export type { BubbleChartProps } from "@michi-vz/core";

export interface BubbleChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
  /** Headless playback controller (null unless the `timeline` prop is set). */
  timeline(): TimelineController | null;
}

export const BubbleChart = forwardRef<BubbleChartHandle, BubbleChartProps>(
  function BubbleChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<BubbleChartProps> | null>(null);

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountBubbleChart(hostRef.current, props);
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
      }),
      [],
    );

    return <div ref={hostRef} style={{ width: props.width ?? 700, height: props.height ?? 500 }} />;
  },
);
