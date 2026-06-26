// Renderer-agnostic semantic context for AreaChart (stacked). Per-key totals +
// chart-agnostic a11yTable + deterministic NL summary, derived from the data
// (identical in SVG and canvas).
import type {
  AreaChartContext,
  AreaDataRow,
  AreaSeriesContext,
  XaxisDataType,
} from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildAreaContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  xAxisDataType: XaxisDataType;
  xAxisDomain: [number, number];
  yAxisDomain: [number, number];
  series: AreaDataRow[];
  activeKeys: string[];
  colorsMapping: Record<string, string>;
}

function keyContext(key: string, series: AreaDataRow[], color: string): AreaSeriesContext {
  const values = series.map((r) => Number(r[key])).filter((v) => Number.isFinite(v));
  const total = values.reduce((a, b) => a + b, 0);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const mean = values.length ? total / values.length : 0;
  return { key, color, total: round(total), min: round(min), max: round(max), mean: round(mean) };
}

export function buildAreaContext(input: BuildAreaContextInput): AreaChartContext {
  const series = input.activeKeys.map((k) =>
    keyContext(k, input.series, input.colorsMapping[k] ?? "")
  );
  const grandTotal = round(series.reduce((a, s) => a + s.total, 0));

  let largestKey: { key: string; total: number } | null = null;
  for (const s of series) {
    if (!largestKey || s.total > largestKey.total) largestKey = { key: s.key, total: s.total };
  }

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Stacked area chart ${titlePart}with ${series.length} series over ${input.series.length} row${
    input.series.length === 1 ? "" : "s"
  }.`;
  if (largestKey) summary += ` Largest series: ${largestKey.key} (total ${largestKey.total}).`;
  summary += ` Combined total ${grandTotal}.`;

  return {
    chartType: "area-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { type: input.xAxisDataType, domain: input.xAxisDomain },
    yAxis: { domain: input.yAxisDomain },
    keys: input.activeKeys,
    series,
    stats: {
      keyCount: series.length,
      rowCount: input.series.length,
      grandTotal,
      largestKey,
    },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: {
      headers: ["Series", "Total", "Min", "Max", "Mean"],
      rows: series.map((s) => [s.key, s.total, s.min, s.max, s.mean]),
    },
  };
}
