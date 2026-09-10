// Per-chart subpath: `import { ... } from "@michi-vz/react/sankey-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from "react";
import { evaluateDataState, mountSankeyChart } from "@michi-vz/core";
import type {
  SankeyChartProps,
  ChartInstance,
  ChartContext,
  TimelineController,
} from "@michi-vz/core";

export type { SankeyChartProps } from "@michi-vz/core";

export interface SankeyChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
  /** Re-run the progressiveDraw reveal animation (no-op unless the prop is set). */
  replay(): void;
  /** Headless playback controller (null unless the `timeline` prop is set). */
  timeline(): TimelineController | null;
}

export type SankeyChartReactProps = SankeyChartProps & {
  isLoadingComponent?: ReactNode;
  isNodataComponent?: ReactNode;
};

export const SankeyChart = forwardRef<SankeyChartHandle, SankeyChartReactProps>(
  function SankeyChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<SankeyChartProps> | null>(null);

    const { isLoadingComponent, isNodataComponent, ...coreProps } = props;
    const engineProps: SankeyChartProps = { ...coreProps, suppressDefaultOverlay: true };

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountSankeyChart(hostRef.current, engineProps);
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
      }),
      [],
    );

    // Sankey's data prop is `nodes` (no unified dataSet); empty nodes → no data.
    const dataState = evaluateDataState({
      isLoading: coreProps.isLoading,
      isNodata: coreProps.isNodata,
      dataSet: coreProps.nodes,
    });
    const overlay =
      dataState === "loading"
        ? (isLoadingComponent ?? <div className="mv-loading" aria-hidden />)
        : dataState === "nodata"
          ? (isNodataComponent ?? (
              <div className="mv-nodata">{coreProps.noDataLabel ?? "No data available"}</div>
            ))
          : null;

    const width = props.width ?? 800;
    const height = props.height ?? 500;
    return (
      <div className="michi-vz michi-vz-react-host" style={{ position: "relative", width, height }}>
        <div ref={hostRef} style={{ width, height }} />
        {overlay !== null && <div style={{ position: "absolute", inset: 0 }}>{overlay}</div>}
      </div>
    );
  },
);
