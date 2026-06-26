// Renderer-agnostic semantic context for RadarChart.
import type { RadarChartContext, RadarDataItem, RadarSeriesContext } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildRadarContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  axes: string[];
  maxValue: number;
  items: RadarDataItem[];
  colorsMapping: Record<string, string>;
}

function seriesContext(it: RadarDataItem, axes: string[], color: string): RadarSeriesContext {
  const byAxis = axes.map((axis, i) => ({ axis, value: Number(it.values[i]) || 0 }));
  const total = round(byAxis.reduce((a, b) => a + b.value, 0));
  let peak: { axis: string; value: number } | null = null;
  for (const b of byAxis) if (!peak || b.value > peak.value) peak = b;
  return { label: it.label, color, byAxis, total, peakAxis: peak ? peak.axis : null };
}

export function buildRadarContext(input: BuildRadarContextInput): RadarChartContext {
  const series = input.items.map((it) =>
    seriesContext(it, input.axes, input.colorsMapping[it.label] ?? it.color ?? "")
  );

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Radar chart ${titlePart}with ${series.length} series across ${input.axes.length} axes (${input.axes.join(
    ", "
  )}).`;
  if (series.length) {
    const top = series.reduce((a, b) => (b.total > a.total ? b : a));
    summary += ` ${top.label} has the largest footprint (peak on ${top.peakAxis}).`;
  }

  return {
    chartType: "radar-chart",
    title: input.title,
    renderer: input.renderer,
    axes: input.axes,
    maxValue: round(input.maxValue),
    series,
    stats: { seriesCount: series.length, axisCount: input.axes.length },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: {
      headers: ["Series", ...input.axes],
      rows: series.map((s) => [s.label, ...s.byAxis.map((b) => b.value)]),
    },
  };
}
