// Per-chart subpath: `import { ... } from "@michi-vz/react/scatter-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from "react";
import { evaluateDataState, mountScatterChart } from "@michi-vz/core";
import type {
  ScatterChartProps,
  ChartInstance,
  ChartContext,
  TimelineController,
} from "@michi-vz/core";
import { svgChildrenMarkup } from "./internal/tooltip";

export type { ScatterChartProps } from "@michi-vz/core";

export interface ScatterChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
  /** Headless playback controller (null unless the `timeline` prop is set). */
  timeline(): TimelineController | null;
}

export type ScatterChartReactProps = ScatterChartProps & {
  isLoadingComponent?: ReactNode;
  isNodataComponent?: ReactNode;
  /** SVG children (axis labels, reference lines) rendered inside the chart <svg>. */
  children?: ReactNode;
};

export const ScatterChart = forwardRef<ScatterChartHandle, ScatterChartReactProps>(
  function ScatterChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<ScatterChartProps> | null>(null);

    const { isLoadingComponent, isNodataComponent, children, ...coreProps } = props;
    // Serialise JSX children → SVG markup so the engine can inject them into the <svg>
    // without a React context (matches the legacy <ScatterPlotChart>'s {children} slot).
    const engineProps: ScatterChartProps = {
      ...coreProps,
      suppressDefaultOverlay: true,
      svgChildren: svgChildrenMarkup(children),
    };

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountScatterChart(hostRef.current, engineProps);
      return () => {
        chartRef.current?.destroy();
        chartRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      chartRef.current?.update(engineProps);
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

    const dataState = evaluateDataState({
      isLoading: coreProps.isLoading,
      isNodata: coreProps.isNodata,
      dataSet: coreProps.dataSet,
    });
    const overlay =
      dataState === "loading"
        ? (isLoadingComponent ?? <div className="mv-loading" aria-hidden />)
        : dataState === "nodata"
          ? (isNodataComponent ?? (
              <div className="mv-nodata">{coreProps.noDataLabel ?? "No data available"}</div>
            ))
          : null;

    const width = props.width ?? 900;
    const height = props.height ?? 480;
    return (
      <div className="michi-vz michi-vz-react-host" style={{ position: "relative", width, height }}>
        <div ref={hostRef} style={{ width, height }} />
        {overlay !== null && <div style={{ position: "absolute", inset: 0 }}>{overlay}</div>}
      </div>
    );
  },
);

// Legacy-name parity: thd imports `ScatterPlotChart` (renamed `ScatterChart` in the
// mono). This alias keeps the consumer swap mechanical; the scatter crosshair /
// dScale / pinIcon feature parity for thd's usage lands in Phase 2.
export const ScatterPlotChart = ScatterChart;
export type ScatterPlotChartProps = ScatterChartReactProps;
export type ScatterPlotChartHandle = ScatterChartHandle;
