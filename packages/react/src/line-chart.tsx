// Per-chart subpath: `import { ... } from "@michi-vz/react/line-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from "react";
import { evaluateDataState, resolveEffectiveProps, mountLineChart } from "@michi-vz/core";
import type {
  LineChartProps,
  ChartInstance,
  ChartContext,
  TimelineController,
} from "@michi-vz/core";
import { useChartContext } from "./internal/context";
import { svgChildrenMarkup } from "./internal/tooltip";

export type { LineChartProps } from "@michi-vz/core";

export interface LineChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
  /** Re-run the progressiveDraw reveal animation (no-op unless the prop is set). */
  replay(): void;
  /** Headless playback controller (null unless the `timeline` prop is set). */
  timeline(): TimelineController | null;
  /** Restore the full x-domain (no-op unless the `zoom` prop is set). */
  resetZoom(): void;
  /** Set the zoomed x-domain in axis units (epoch ms on date axes); null clears.
   *  No-op unless the `zoom` prop is set. */
  setZoomDomain(domain: [number, number] | null): void;
}

/** React-only overlay nodes layered over the chart when loading / no-data. */
export type LineChartReactProps = LineChartProps & {
  isLoadingComponent?: ReactNode;
  isNodataComponent?: ReactNode;
  /** SVG children (axis-title text, reference lines) rendered inside the chart <svg>. */
  children?: ReactNode;
};

export const LineChart = forwardRef<LineChartHandle, LineChartReactProps>(
  function LineChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<LineChartProps> | null>(null);
    // Subscribe to shared state → re-render (and re-merge) when colours/highlight change.
    const shared = useChartContext();

    const { isLoadingComponent, isNodataComponent, children, ...coreProps } = props;
    // Merge shared state into props (faithful to the legacy context merge), then
    // suppress the engine's vanilla overlay - React renders the overlay node below.
    // Serialise JSX children → SVG markup so the engine can inject them into the <svg>
    // without a React context (matches the legacy <LineChart>'s {children} slot).
    const engineProps: LineChartProps = {
      ...resolveEffectiveProps(coreProps, shared),
      suppressDefaultOverlay: true,
      svgChildren: svgChildrenMarkup(children),
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

    useImperativeHandle(
      ref,
      () => ({
        getContext: () => chartRef.current?.getContext() ?? null,
        getElement: () => hostRef.current,
        timeline: () => chartRef.current?.timeline?.() ?? null,
        replay: () => chartRef.current?.replay?.(),
        resetZoom: () => chartRef.current?.resetZoom?.(),
        setZoomDomain: (domain: [number, number] | null) =>
          chartRef.current?.setZoomDomain?.(domain),
      }),
      [],
    );

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
          ? (isNodataComponent ?? (
              <div className="mv-nodata">{coreProps.noDataLabel ?? "No data available"}</div>
            ))
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
  },
);
