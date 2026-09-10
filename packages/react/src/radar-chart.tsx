// Per-chart subpath: `import { ... } from "@michi-vz/react/radar-chart"`.
// The provider/hook come from ./internal/context - the ONE module that owns the
// React context identity. Never call createContext here.
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  Fragment,
  type ReactNode,
  type ReactElement,
} from "react";
import { evaluateDataState, mountRadarChart } from "@michi-vz/core";
import type {
  RadarChartProps,
  ChartInstance,
  ChartContext,
  TimelineController,
} from "@michi-vz/core";

export type { RadarChartProps, ChartContext } from "@michi-vz/core";

export interface RadarChartHandle {
  getContext(): ChartContext | null;
  /** The chart host element (contains the svg/canvas). Feed it to the core
   *  chartToStyledSvgDataUri / chartToPngDataUrl export helpers. */
  getElement(): HTMLElement | null;
  /** Re-run the progressiveDraw reveal animation (no-op unless the prop is set). */
  replay(): void;
  /** Headless playback controller (null unless the `timeline` prop is set). */
  timeline(): TimelineController | null;
}

export type RadarChartReactProps = RadarChartProps & {
  isLoadingComponent?: ReactNode;
  isNodataComponent?: ReactNode;
};

export const RadarChart = forwardRef<RadarChartHandle, RadarChartReactProps>(
  function RadarChart(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<ChartInstance<RadarChartProps> | null>(null);

    const { isLoadingComponent, isNodataComponent, ...coreProps } = props;
    // The wrapper renders its OWN loading/no-data node below, so suppress the engine's vanilla overlay.
    const engineProps: RadarChartProps = { ...coreProps, suppressDefaultOverlay: true };

    useEffect(() => {
      if (!hostRef.current) return;
      chartRef.current = mountRadarChart(hostRef.current, engineProps);
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

    // Radar's data prop is `series`, not `dataSet`.
    const dataState = evaluateDataState({
      isLoading: coreProps.isLoading,
      isNodata: coreProps.isNodata,
      dataSet: coreProps.series,
    });
    const overlay =
      dataState === "loading"
        ? (isLoadingComponent ?? <div className="mv-loading" aria-hidden />)
        : dataState === "nodata"
          ? (isNodataComponent ?? (
              <div className="mv-nodata">{coreProps.noDataLabel ?? "No data available"}</div>
            ))
          : null;

    const width = props.width ?? 600;
    const height = props.height ?? 600;
    return (
      <div className="michi-vz michi-vz-react-host" style={{ position: "relative", width, height }}>
        <div ref={hostRef} style={{ width, height }} />
        {overlay !== null && <div style={{ position: "absolute", inset: 0 }}>{overlay}</div>}
      </div>
    );
  },
);

// ─── RadarChartSet ────────────────────────────────────────────────────────────
// Orchestrates N independent RadarChart instances side-by-side and exposes a single
// merged onChartDataProcessed surface (fires once every child has reported). Ported
// from the legacy michi-vz RadarChartSet; types adapted to the mono RadarChart API.
type RadarChartSetSharedProps = Omit<RadarChartProps, "series" | "onChartDataProcessed">;

export interface RadarChartSetItem {
  key: string;
  series: RadarChartProps["series"];
  /** Per-item prop overrides; spread AFTER the shared props so the item wins. */
  props?: Partial<RadarChartSetSharedProps>;
}

export interface RadarChartSetProps extends Partial<RadarChartSetSharedProps> {
  items: RadarChartSetItem[];
  onChartDataProcessed?: (metadata: ChartContext) => void;
  onLegendDataChange?: (legendData: NonNullable<ChartContext["legendData"]>) => void;
  renderItem?: (params: { item: RadarChartSetItem; index: number; chart: ReactNode }) => ReactNode;
}

type LegendRows = NonNullable<ChartContext["legendData"]>;

const buildMergedLegendData = (
  orderedKeys: string[],
  byItem: Record<string, ChartContext>,
): LegendRows => {
  const map = new Map<string, LegendRows[number]>();
  let cursor = 0;
  for (const key of orderedKeys) {
    for (const entry of byItem[key]?.legendData ?? []) {
      const ex = map.get(entry.label);
      // First occurrence wins the order; color updates to the latest; disabled is AND'd.
      if (!ex) map.set(entry.label, { ...entry, order: cursor++ });
      else
        map.set(entry.label, {
          ...ex,
          color: entry.color,
          disabled: Boolean(ex.disabled) && Boolean(entry.disabled),
        });
    }
  }
  return Array.from(map.values());
};

const mergeRadarMetadata = (
  orderedKeys: string[],
  byItem: Record<string, ChartContext>,
): ChartContext | null => {
  if (orderedKeys.length === 0) return null;
  // Gate: fire only when EVERY current child has reported its context.
  if (!orderedKeys.every((k) => Boolean(byItem[k]))) return null;
  const all = orderedKeys.map((k) => byItem[k]);
  const colorsMapping = Object.assign({}, ...all.map((m) => m.colorsMapping ?? {}));
  const legendData = buildMergedLegendData(orderedKeys, byItem);
  // Use the first child's context as the base shape, overwrite the merged surfaces.
  return { ...all[0], colorsMapping, legendData };
};

export function RadarChartSet({
  items,
  onChartDataProcessed,
  onLegendDataChange,
  renderItem,
  ...sharedProps
}: RadarChartSetProps): ReactElement {
  const [byItem, setByItem] = useState<Record<string, ChartContext>>({});
  const prevMerged = useRef<string>("");
  const orderedKeys = useMemo(() => items.map((it) => it.key), [items]);

  // Prune stale keys when items change so a removed chart can't hold the "all ready" gate.
  useEffect(() => {
    const active = new Set(orderedKeys);
    setByItem((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([k]) => active.has(k)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [orderedKeys]);

  const handleChild = useCallback((key: string, ctx: ChartContext): void => {
    setByItem((prev) => {
      if (prev[key] && JSON.stringify(prev[key]) === JSON.stringify(ctx)) return prev;
      return { ...prev, [key]: ctx };
    });
  }, []);

  const merged = useMemo(() => mergeRadarMetadata(orderedKeys, byItem), [orderedKeys, byItem]);

  useEffect(() => {
    if (!merged) return;
    const sig = JSON.stringify(merged);
    if (sig === prevMerged.current) return;
    prevMerged.current = sig;
    onChartDataProcessed?.(merged);
    if (merged.legendData) onLegendDataChange?.(merged.legendData);
  }, [merged, onChartDataProcessed, onLegendDataChange]);

  return (
    <>
      {items.map((item, index) => {
        const chart = (
          <RadarChart
            key={item.key}
            {...(sharedProps as RadarChartSetSharedProps)}
            {...(item.props as RadarChartSetSharedProps)}
            series={item.series}
            onChartDataProcessed={(ctx) => handleChild(item.key, ctx)}
          />
        );
        if (renderItem)
          return <Fragment key={item.key}>{renderItem({ item, index, chart })}</Fragment>;
        return chart;
      })}
    </>
  );
}
