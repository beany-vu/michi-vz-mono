// Per-chart subpath: `import { ... } from "@michi-vz/react/gap-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from "react";
import { evaluateDataState, mountGapChart } from "@michi-vz/core";
import type {
  GapChartProps,
  ChartInstance,
  ChartContext,
  TimelineController,
} from "@michi-vz/core";

export type { GapChartProps } from "@michi-vz/core";

export interface GapChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
  /** Headless playback controller (null unless the `timeline` prop is set). */
  timeline(): TimelineController | null;
}

export type GapChartReactProps = GapChartProps & {
  isLoadingComponent?: ReactNode;
  isNodataComponent?: ReactNode;
};

export const GapChart = forwardRef<GapChartHandle, GapChartReactProps>(
  function GapChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<GapChartProps> | null>(null);

    const { isLoadingComponent, isNodataComponent, ...coreProps } = props;
    // The wrapper renders its OWN loading/no-data node below, so suppress the engine's vanilla overlay.
    const engineProps: GapChartProps = { ...coreProps, suppressDefaultOverlay: true };

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountGapChart(hostRef.current, engineProps);
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

    const width = props.width ?? 1000;
    const height = props.height ?? 500;
    return (
      <div className="michi-vz michi-vz-react-host" style={{ position: "relative", width, height }}>
        <div ref={hostRef} style={{ width, height }} />
        {overlay !== null && <div style={{ position: "absolute", inset: 0 }}>{overlay}</div>}
      </div>
    );
  },
);
