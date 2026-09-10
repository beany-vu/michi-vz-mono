// Per-chart subpath: `import { ... } from "@michi-vz/react/pie-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { mountPieChart } from "@michi-vz/core";
import type {
  PieChartProps,
  ChartInstance,
  ChartContext,
  TimelineController,
} from "@michi-vz/core";

export type { PieChartProps } from "@michi-vz/core";

export interface PieChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
  /** Headless playback controller (null unless the `timeline` prop is set). */
  timeline(): TimelineController | null;
}

export const PieChart = forwardRef<PieChartHandle, PieChartProps>(function PieChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<PieChartProps> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountPieChart(hostRef.current, props);
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

  return <div ref={hostRef} style={{ width: props.width ?? 600, height: props.height ?? 420 }} />;
});
