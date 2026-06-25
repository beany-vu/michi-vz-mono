// React wrapper over the @michi-vz/core engine. SSR-safe: renders a sized
// placeholder on the server and mounts the engine on the client in an effect.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { mountGapChart } from "@michi-vz/core";
import type { GapChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { GapChartProps, ChartContext } from "@michi-vz/core";

export interface GapChartHandle {
  getContext(): ChartContext | null;
}

export const GapChart = forwardRef<GapChartHandle, GapChartProps>(function GapChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<GapChartProps> | null>(null);

  // Mount once on the client.
  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountGapChart(hostRef.current, props);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push latest props on every render.
  useEffect(() => {
    chartRef.current?.update(props);
  });

  useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

  return <div ref={hostRef} style={{ width: props.width ?? 1000, height: props.height ?? 500 }} />;
});
