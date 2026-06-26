// React wrapper over the @michi-vz/core engine. SSR-safe: renders a sized
// placeholder on the server and mounts the engine on the client in an effect.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  mountGapChart,
  mountLineChart,
  mountAreaChart,
  mountScatterChart,
  mountVerticalStackBarChart,
  mountComparableHorizontalBarChart,
  mountDualHorizontalBarChart,
} from "@michi-vz/core";
import type {
  GapChartProps,
  LineChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  DualBarChartProps,
  ChartInstance,
  ChartContext,
} from "@michi-vz/core";

export type {
  GapChartProps,
  LineChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  DualBarChartProps,
  ChartContext,
} from "@michi-vz/core";

export interface GapChartHandle {
  getContext(): ChartContext | null;
}

export interface LineChartHandle {
  getContext(): ChartContext | null;
}

export interface AreaChartHandle {
  getContext(): ChartContext | null;
}

export interface ScatterChartHandle {
  getContext(): ChartContext | null;
}

export interface VerticalStackBarChartHandle {
  getContext(): ChartContext | null;
}

export interface ComparableHorizontalBarChartHandle {
  getContext(): ChartContext | null;
}

export interface DualHorizontalBarChartHandle {
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

export const LineChart = forwardRef<LineChartHandle, LineChartProps>(function LineChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<LineChartProps> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountLineChart(hostRef.current, props);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.update(props);
  });

  useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

  return <div ref={hostRef} style={{ width: props.width ?? 1000, height: props.height ?? 500 }} />;
});

export const AreaChart = forwardRef<AreaChartHandle, AreaChartProps>(function AreaChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<AreaChartProps> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountAreaChart(hostRef.current, props);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.update(props);
  });

  useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

  return <div ref={hostRef} style={{ width: props.width ?? 900, height: props.height ?? 480 }} />;
});

export const ScatterChart = forwardRef<ScatterChartHandle, ScatterChartProps>(function ScatterChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<ScatterChartProps> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountScatterChart(hostRef.current, props);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.update(props);
  });

  useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

  return <div ref={hostRef} style={{ width: props.width ?? 900, height: props.height ?? 480 }} />;
});

export const VerticalStackBarChart = forwardRef<VerticalStackBarChartHandle, VerticalStackBarChartProps>(
  function VerticalStackBarChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<VerticalStackBarChartProps> | null>(null);

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountVerticalStackBarChart(hostRef.current, props);
      return () => {
        chartRef.current?.destroy();
        chartRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      chartRef.current?.update(props);
    });

    useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

    return <div ref={hostRef} style={{ width: props.width ?? 900, height: props.height ?? 480 }} />;
  }
);

export const ComparableHorizontalBarChart = forwardRef<
  ComparableHorizontalBarChartHandle,
  ComparableBarChartProps
>(function ComparableHorizontalBarChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<ComparableBarChartProps> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountComparableHorizontalBarChart(hostRef.current, props);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.update(props);
  });

  useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

  return <div ref={hostRef} style={{ width: props.width ?? 900, height: props.height ?? 480 }} />;
});

export const DualHorizontalBarChart = forwardRef<DualHorizontalBarChartHandle, DualBarChartProps>(
  function DualHorizontalBarChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<DualBarChartProps> | null>(null);

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountDualHorizontalBarChart(hostRef.current, props);
      return () => {
        chartRef.current?.destroy();
        chartRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      chartRef.current?.update(props);
    });

    useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

    return <div ref={hostRef} style={{ width: props.width ?? 900, height: props.height ?? 480 }} />;
  }
);
