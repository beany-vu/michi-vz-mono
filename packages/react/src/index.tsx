// React wrapper over the @michi-vz/core engine. SSR-safe: renders a sized
// placeholder on the server and mounts the engine on the client in an effect.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  mountGapChart,
  mountLineChart,
  mountFanChart,
  mountAreaChart,
  mountScatterChart,
  mountVerticalStackBarChart,
  mountComparableHorizontalBarChart,
  mountDualHorizontalBarChart,
  mountBarBellChart,
  mountRangeChart,
  mountRibbonChart,
  mountRadarChart,
  mountTreemapChart,
  mountPieChart,
  mountBubbleChart,
  mountSankeyChart,
  mountFountainChart,
} from "@michi-vz/core";
import type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  TreemapChartProps,
  PieChartProps,
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ChartInstance,
  ChartContext,
} from "@michi-vz/core";

export type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  TreemapChartProps,
  PieChartProps,
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ChartContext,
} from "@michi-vz/core";

export interface GapChartHandle {
  getContext(): ChartContext | null;
}

export interface LineChartHandle {
  getContext(): ChartContext | null;
}

export interface FanChartHandle {
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

export interface BarBellChartHandle {
  getContext(): ChartContext | null;
}

export interface RangeChartHandle {
  getContext(): ChartContext | null;
}

export interface RibbonChartHandle {
  getContext(): ChartContext | null;
}

export interface RadarChartHandle {
  getContext(): ChartContext | null;
}

export interface TreemapChartHandle {
  getContext(): ChartContext | null;
}

export interface PieChartHandle {
  getContext(): ChartContext | null;
}

export interface BubbleChartHandle {
  getContext(): ChartContext | null;
}

export interface SankeyChartHandle {
  getContext(): ChartContext | null;
}

export interface FountainChartHandle {
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

export const FanChart = forwardRef<FanChartHandle, FanChartProps>(function FanChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<FanChartProps> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountFanChart(hostRef.current, props);
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

export const BarBellChart = forwardRef<BarBellChartHandle, BarBellChartProps>(
  function BarBellChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<BarBellChartProps> | null>(null);

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountBarBellChart(hostRef.current, props);
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

export const RangeChart = forwardRef<RangeChartHandle, RangeChartProps>(function RangeChart(props, ref) {
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

  useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

  return <div ref={hostRef} style={{ width: props.width ?? 1000, height: props.height ?? 500 }} />;
});

export const RibbonChart = forwardRef<RibbonChartHandle, RibbonChartProps>(function RibbonChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<RibbonChartProps> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountRibbonChart(hostRef.current, props);
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

export const RadarChart = forwardRef<RadarChartHandle, RadarChartProps>(function RadarChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<RadarChartProps> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountRadarChart(hostRef.current, props);
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

  return <div ref={hostRef} style={{ width: props.width ?? 600, height: props.height ?? 600 }} />;
});

export const TreemapChart = forwardRef<TreemapChartHandle, TreemapChartProps>(function TreemapChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<TreemapChartProps> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountTreemapChart(hostRef.current, props);
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

  return <div ref={hostRef} style={{ width: props.width ?? 900, height: props.height ?? 520 }} />;
});

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

  useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

  return <div ref={hostRef} style={{ width: props.width ?? 600, height: props.height ?? 420 }} />;
});

export const BubbleChart = forwardRef<BubbleChartHandle, BubbleChartProps>(function BubbleChart(props, ref) {
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

  useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

  return <div ref={hostRef} style={{ width: props.width ?? 700, height: props.height ?? 500 }} />;
});

export const SankeyChart = forwardRef<SankeyChartHandle, SankeyChartProps>(function SankeyChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<SankeyChartProps> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountSankeyChart(hostRef.current, props);
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

  return <div ref={hostRef} style={{ width: props.width ?? 800, height: props.height ?? 500 }} />;
});

export const FountainChart = forwardRef<FountainChartHandle, FountainChartProps>(function FountainChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<FountainChartProps> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountFountainChart(hostRef.current, props);
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

  return <div ref={hostRef} style={{ width: props.width ?? 800, height: props.height ?? 500 }} />;
});
