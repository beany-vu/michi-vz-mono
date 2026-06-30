// React wrapper over the @michi-vz/core engine. SSR-safe: renders a sized
// placeholder on the server and mounts the engine on the client in an effect.
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type ReactElement,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
  createMichiVzStore,
  resolveEffectiveProps,
  evaluateDataState,
} from "@michi-vz/core";
import type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  ComparableBarDataPoint,
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
  MichiVzStore,
  MichiVzState,
  SinglePointLineConfig,
} from "@michi-vz/core";

export type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  ComparableBarDataPoint,
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

// Hatch-pattern helper (for the `patternsMapping` prop) — re-exported so consumers
// import it from @michi-vz/react like the legacy michi-vz did.
export { createHatchPattern } from "@michi-vz/core";
export type { HatchPatternOptions } from "@michi-vz/core";

// ---------------------------------------------------------------------------
// Shared-state provider + hook — parity with the legacy michi-vz MichiVzProvider
// / useChartContext, backed by the framework-agnostic createMichiVzStore. The
// hook subscribes via useSyncExternalStore so charts re-render on shared-state
// changes (tear-free under concurrent rendering). A future CustomEvent
// coordinator can layer on the same store for cross-framework / web-component use.
// ---------------------------------------------------------------------------

export type { MichiVzState } from "@michi-vz/core";

const DEFAULT_CONTEXT_STATE: MichiVzState = {
  colorsMapping: {},
  highlightItems: [],
  disabledItems: [],
  hiddenItems: [],
  visibleItems: [],
};

const MichiVzContext = createContext<MichiVzStore | null>(null);
const noopSubscribe = (): (() => void) => () => {};

export interface MichiVzProviderProps {
  children?: ReactNode;
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  hiddenItems?: string[];
  visibleItems?: string[];
  fontFamily?: string;
  singlePointLine?: boolean | SinglePointLineConfig;
  categoryMetadata?: Record<string, { color?: string; label?: string }>;
  colorsBasedMapping?: Record<string, string>;
  locale?: string;
  dir?: "ltr" | "rtl";
}

function stateFromProps(p: MichiVzProviderProps): MichiVzState {
  return {
    colorsMapping: p.colorsMapping ?? {},
    highlightItems: p.highlightItems ?? [],
    disabledItems: p.disabledItems ?? [],
    hiddenItems: p.hiddenItems ?? [],
    visibleItems: p.visibleItems ?? [],
    fontFamily: p.fontFamily,
    singlePointLine: p.singlePointLine,
    categoryMetadata: p.categoryMetadata,
    colorsBasedMapping: p.colorsBasedMapping,
    locale: p.locale,
    dir: p.dir,
  };
}

export function MichiVzProvider(props: MichiVzProviderProps) {
  const storeRef = useRef<MichiVzStore | null>(null);
  if (storeRef.current === null) storeRef.current = createMichiVzStore(stateFromProps(props));

  // Re-sync props → store on change. Identity-stable selector outputs (e.g.
  // react-redux shallowEqual) keep this from firing every render.
  useEffect(() => {
    storeRef.current?.set(stateFromProps(props));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.colorsMapping,
    props.highlightItems,
    props.disabledItems,
    props.hiddenItems,
    props.visibleItems,
    props.fontFamily,
    props.singlePointLine,
    props.categoryMetadata,
    props.colorsBasedMapping,
    props.locale,
    props.dir,
  ]);

  return <MichiVzContext.Provider value={storeRef.current}>{props.children}</MichiVzContext.Provider>;
}

/**
 * Read the shared MichiVz state (colorsMapping / highlightItems / disabledItems /
 * hiddenItems / visibleItems / fontFamily / singlePointLine). Returns empty
 * defaults when no MichiVzProvider is mounted, so consumers never read undefined.
 */
export function useChartContext(): MichiVzState {
  const store = useContext(MichiVzContext);
  const getSnapshot = store ? store.get : () => DEFAULT_CONTEXT_STATE;
  return useSyncExternalStore(store ? store.subscribe : noopSubscribe, getSnapshot, getSnapshot);
}

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

/** React-only overlay nodes layered over the chart when loading / no-data. */
export type LineChartReactProps = LineChartProps & {
  isLoadingComponent?: ReactNode;
  isNodataComponent?: ReactNode;
};

export const LineChart = forwardRef<LineChartHandle, LineChartReactProps>(function LineChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<LineChartProps> | null>(null);
  // Subscribe to shared state → re-render (and re-merge) when colours/highlight change.
  const shared = useChartContext();

  const { isLoadingComponent, isNodataComponent, ...coreProps } = props;
  // Merge shared state into props (faithful to the legacy context merge), then
  // suppress the engine's vanilla overlay — React renders the overlay node below.
  const engineProps: LineChartProps = {
    ...resolveEffectiveProps(coreProps, shared),
    suppressDefaultOverlay: true,
  };

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountLineChart(hostRef.current, engineProps);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.update(engineProps);
  });

  useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

  // Same decision the engine makes (so they agree on skip-marks vs overlay).
  const dataState = evaluateDataState({
    isLoading: coreProps.isLoading,
    isNodata: coreProps.isNodata,
    dataSet: coreProps.dataSet,
  });
  const overlay =
    dataState === "loading"
      ? (isLoadingComponent ?? <div className="mv-loading" aria-hidden />)
      : dataState === "nodata"
        ? (isNodataComponent ?? <div className="mv-nodata">{coreProps.noDataLabel ?? "No data available"}</div>)
        : null;

  const width = props.width ?? 1000;
  const height = props.height ?? 500;
  // Outer carries `michi-vz` so the default `.mv-loading` / `.mv-nodata` CSS reaches
  // the overlay (the engine's own `.michi-vz` is on the inner host).
  return (
    <div className="michi-vz michi-vz-react-host" style={{ position: "relative", width, height }}>
      <div ref={hostRef} style={{ width, height }} />
      {overlay !== null && <div style={{ position: "absolute", inset: 0 }}>{overlay}</div>}
    </div>
  );
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

export type VerticalStackBarChartReactProps = VerticalStackBarChartProps & {
  isLoadingComponent?: ReactNode;
  isNodataComponent?: ReactNode;
};

export const VerticalStackBarChart = forwardRef<VerticalStackBarChartHandle, VerticalStackBarChartReactProps>(
  function VerticalStackBarChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<VerticalStackBarChartProps> | null>(null);
    const shared = useChartContext();

    const { isLoadingComponent, isNodataComponent, ...coreProps } = props;
    const engineProps: VerticalStackBarChartProps = {
      ...resolveEffectiveProps(coreProps, shared),
      suppressDefaultOverlay: true,
    };

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountVerticalStackBarChart(hostRef.current, engineProps);
      return () => {
        chartRef.current?.destroy();
        chartRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      chartRef.current?.update(engineProps);
    });

    useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

    const dataState = evaluateDataState({
      isLoading: coreProps.isLoading,
      isNodata: coreProps.isNodata,
      dataSet: coreProps.dataSet,
    });
    const overlay =
      dataState === "loading"
        ? (isLoadingComponent ?? <div className="mv-loading" aria-hidden />)
        : dataState === "nodata"
          ? (isNodataComponent ?? <div className="mv-nodata">{coreProps.noDataLabel ?? "No data available"}</div>)
          : null;

    const width = props.width ?? 900;
    const height = props.height ?? 480;
    return (
      <div className="michi-vz michi-vz-react-host" style={{ position: "relative", width, height }}>
        <div ref={hostRef} style={{ width, height }} />
        {overlay !== null && <div style={{ position: "absolute", inset: 0 }}>{overlay}</div>}
      </div>
    );
  }
);

export type ComparableHorizontalBarChartReactProps = Omit<ComparableBarChartProps, "tooltipFormatter"> & {
  isLoadingComponent?: ReactNode;
  isNodataComponent?: ReactNode;
  /** May return a string OR a React node (converted to static HTML for the canvas tooltip). */
  tooltipFormatter?: (
    d: ComparableBarDataPoint,
    dataSet?: ComparableBarDataPoint[],
    type?: "based" | "compared"
  ) => string | ReactNode;
};

export const ComparableHorizontalBarChart = forwardRef<
  ComparableHorizontalBarChartHandle,
  ComparableHorizontalBarChartReactProps
>(function ComparableHorizontalBarChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<ComparableBarChartProps> | null>(null);
  const shared = useChartContext();

  const { isLoadingComponent, isNodataComponent, tooltipFormatter, ...coreProps } = props;
  // Consumers return JSX from tooltipFormatter; the core sanitizes a STRING, so
  // convert any React-node result to static HTML here (else it stringifies to
  // "[object Object]").
  const wrappedFormatter = tooltipFormatter
    ? (d: ComparableBarDataPoint, dataSet?: ComparableBarDataPoint[], type?: "based" | "compared") => {
        const out = tooltipFormatter(d, dataSet, type);
        return typeof out === "string" ? out : renderToStaticMarkup(out as ReactElement);
      }
    : undefined;
  const engineProps: ComparableBarChartProps = {
    ...resolveEffectiveProps(coreProps, shared),
    tooltipFormatter: wrappedFormatter,
    suppressDefaultOverlay: true,
  };

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountComparableHorizontalBarChart(hostRef.current, engineProps);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chartRef.current?.update(engineProps);
  });

  useImperativeHandle(ref, () => ({ getContext: () => chartRef.current?.getContext() ?? null }), []);

  const dataState = evaluateDataState({
    isLoading: coreProps.isLoading,
    isNodata: coreProps.isNodata,
    dataSet: coreProps.dataSet,
  });
  const overlay =
    dataState === "loading"
      ? (isLoadingComponent ?? <div className="mv-loading" aria-hidden />)
      : dataState === "nodata"
        ? (isNodataComponent ?? <div className="mv-nodata">{coreProps.noDataLabel ?? "No data available"}</div>)
        : null;

  const width = props.width ?? 900;
  const height = props.height ?? 480;
  return (
    <div className="michi-vz michi-vz-react-host" style={{ position: "relative", width, height }}>
      <div ref={hostRef} style={{ width, height }} />
      {overlay !== null && <div style={{ position: "absolute", inset: 0 }}>{overlay}</div>}
    </div>
  );
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

// Legacy-name parity: thd imports `ScatterPlotChart` (renamed `ScatterChart` in the
// mono). This alias keeps the consumer swap mechanical; the scatter crosshair /
// dScale / pinIcon feature parity for thd's usage lands in Phase 2.
export const ScatterPlotChart = ScatterChart;
export type ScatterPlotChartProps = ScatterChartProps;
export type ScatterPlotChartHandle = ScatterChartHandle;
