// Per-chart subpath: `import { ... } from "@michi-vz/react/gauge-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { mountGaugeChart } from "@michi-vz/core";
import type { GaugeChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { GaugeChartProps } from "@michi-vz/core";

export interface GaugeChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
}

export const GaugeChart = forwardRef<GaugeChartHandle, GaugeChartProps>(
  function GaugeChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<GaugeChartProps> | null>(null);

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountGaugeChart(hostRef.current, props);
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
      }),
      [],
    );

    return <div ref={hostRef} style={{ width: props.width ?? 300, height: props.height ?? 300 }} />;
  },
);
