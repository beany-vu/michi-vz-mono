// Per-chart subpath: `import { ... } from "@michi-vz/react/bar-bell-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from "react";
import { evaluateDataState, mountBarBellChart } from "@michi-vz/core";
import type {
  BarBellChartProps,
  ChartInstance,
  ChartContext,
  TimelineController,
} from "@michi-vz/core";

export type { BarBellChartProps } from "@michi-vz/core";

export interface BarBellChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
  /** Re-run the progressiveDraw reveal animation (no-op unless the prop is set). */
  replay(): void;
  /** Headless playback controller (null unless the `timeline` prop is set). */
  timeline(): TimelineController | null;
}

export type BarBellChartReactProps = BarBellChartProps & {
  isLoadingComponent?: ReactNode;
  isNodataComponent?: ReactNode;
  /** Legacy alias for tooltipFormatter (BorderCrossingTime passes `tooltipFormat`). */
  tooltipFormat?: BarBellChartProps["tooltipFormatter"];
};

export const BarBellChart = forwardRef<BarBellChartHandle, BarBellChartReactProps>(
  function BarBellChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<BarBellChartProps> | null>(null);

    const { isLoadingComponent, isNodataComponent, tooltipFormat, ...coreProps } = props;
    const engineProps: BarBellChartProps = {
      ...coreProps,
      tooltipFormatter: coreProps.tooltipFormatter ?? tooltipFormat,
      suppressDefaultOverlay: true,
    };

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountBarBellChart(hostRef.current, engineProps);
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
