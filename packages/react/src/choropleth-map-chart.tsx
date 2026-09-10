// Per-chart subpath: `import { ... } from "@michi-vz/react/choropleth-map-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from "react";
import { evaluateDataState, resolveEffectiveProps, mountChoroplethMapChart } from "@michi-vz/core";
import type {
  ChoroplethDataItem,
  ChoroplethMapChartProps,
  ChartInstance,
  ChartContext,
  TimelineController,
} from "@michi-vz/core";
import { useChartContext } from "./internal/context";
import { toTooltipHtml } from "./internal/tooltip";

export type { ChoroplethMapChartProps, ChoroplethDataItem, GeoFeatureItem } from "@michi-vz/core";

export interface ChoroplethMapChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
  /** Headless playback controller (null unless the `timeline` prop is set). */
  timeline(): TimelineController | null;
}

export type ChoroplethMapChartReactProps = Omit<ChoroplethMapChartProps, "tooltipFormatter"> & {
  isLoadingComponent?: ReactNode;
  isNodataComponent?: ReactNode;
  /** May return a string OR a React node (converted to static HTML for the canvas/webgpu tooltip). */
  tooltipFormatter?: (d: ChoroplethDataItem | { id: string; name?: string }) => string | ReactNode;
};

export const ChoroplethMapChart = forwardRef<
  ChoroplethMapChartHandle,
  ChoroplethMapChartReactProps
>(function ChoroplethMapChart(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance<ChoroplethMapChartProps> | null>(null);
  const shared = useChartContext();

  const { isLoadingComponent, isNodataComponent, tooltipFormatter, ...coreProps } = props;
  // Consumers return JSX from tooltipFormatter; the core sanitizes a STRING, so
  // convert any React-node result to static HTML here (else it stringifies to
  // "[object Object]").
  const wrappedFormatter = tooltipFormatter
    ? (d: ChoroplethDataItem | { id: string; name?: string }) => {
        const out = tooltipFormatter(d);
        return toTooltipHtml(out);
      }
    : undefined;
  const engineProps: ChoroplethMapChartProps = {
    ...resolveEffectiveProps(coreProps, shared),
    tooltipFormatter: wrappedFormatter,
    suppressDefaultOverlay: true,
  };

  useEffect(() => {
    if (!hostRef.current) return;
    chartRef.current = mountChoroplethMapChart(hostRef.current, engineProps);
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
  const height = props.height ?? 520;
  return (
    <div className="michi-vz michi-vz-react-host" style={{ position: "relative", width, height }}>
      <div ref={hostRef} style={{ width, height }} />
      {overlay !== null && <div style={{ position: "absolute", inset: 0 }}>{overlay}</div>}
    </div>
  );
});
