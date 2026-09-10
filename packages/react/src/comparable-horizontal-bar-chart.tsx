// Per-chart subpath: `import { ... } from "@michi-vz/react/comparable-horizontal-bar-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from "react";
import {
  evaluateDataState,
  resolveEffectiveProps,
  mountComparableHorizontalBarChart,
} from "@michi-vz/core";
import type {
  ComparableBarChartProps,
  ComparableBarDataPoint,
  ChartInstance,
  ChartContext,
  TimelineController,
} from "@michi-vz/core";
import { useChartContext } from "./internal/context";
import { toTooltipHtml } from "./internal/tooltip";

export type { ComparableBarChartProps, ComparableBarDataPoint } from "@michi-vz/core";

export interface ComparableHorizontalBarChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
  /** Headless playback controller (null unless the `timeline` prop is set). */
  timeline(): TimelineController | null;
}

export type ComparableHorizontalBarChartReactProps = Omit<
  ComparableBarChartProps,
  "tooltipFormatter"
> & {
  isLoadingComponent?: ReactNode;
  isNodataComponent?: ReactNode;
  /** May return a string OR a React node (converted to static HTML for the canvas tooltip). */
  tooltipFormatter?: (
    d: ComparableBarDataPoint,
    dataSet?: ComparableBarDataPoint[],
    type?: "based" | "compared",
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
    ? (
        d: ComparableBarDataPoint,
        dataSet?: ComparableBarDataPoint[],
        type?: "based" | "compared",
      ) => {
        const out = tooltipFormatter(d, dataSet, type);
        return toTooltipHtml(out);
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
});
