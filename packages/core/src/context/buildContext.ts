// Renderer-agnostic semantic context. Derived purely from the data model +
// domains (NOT the DOM), so it is byte-identical whether the chart is rendered
// as SVG or canvas — the bridge for LLM tool-use / RAG / agents and the source
// for the a11y mirror. `summary` is a deterministic, model-free NL string that
// doubles as alt text.
import type { ChartContext, GapDataItem, GapSeriesContext, XaxisDataType } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  xAxisDataType: XaxisDataType;
  xAxisDomain: [number, number];
  processedDataSet: GapDataItem[];
  colorsMapping: Record<string, string>;
}

export function buildGapContext(input: BuildContextInput): ChartContext {
  const series: GapSeriesContext[] = input.processedDataSet.map((d) => {
    const difference = d.difference ?? d.value1 - d.value2;
    return {
      label: d.label,
      code: d.code,
      value1: d.value1,
      value2: d.value2,
      difference,
      gap: Math.abs(difference),
    };
  });

  const gaps = series.map((s) => s.gap);
  let maxGap: ChartContext["stats"]["maxGap"] = null;
  let minGap: ChartContext["stats"]["minGap"] = null;
  if (series.length > 0) {
    let hi = series[0];
    let lo = series[0];
    for (const s of series) {
      if (s.gap > hi.gap) hi = s;
      if (s.gap < lo.gap) lo = s;
    }
    maxGap = { label: hi.label, value: round(hi.gap) };
    minGap = { label: lo.label, value: round(lo.gap) };
  }
  const meanGap = gaps.length ? round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0;
  const totalValue1 = round(series.reduce((a, s) => a + s.value1, 0));
  const totalValue2 = round(series.reduce((a, s) => a + s.value2, 0));

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Gap chart ${titlePart}compares value1 vs value2 across ${series.length} item${
    series.length === 1 ? "" : "s"
  }.`;
  if (maxGap) summary += ` Largest gap: ${maxGap.label} (${maxGap.value}).`;
  if (minGap && series.length > 1) summary += ` Smallest gap: ${minGap.label} (${minGap.value}).`;
  if (series.length > 0) summary += ` Average gap ${meanGap}.`;

  return {
    chartType: "gap-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { type: input.xAxisDataType, domain: input.xAxisDomain },
    yAxis: { labels: series.map((s) => s.label) },
    series,
    stats: { count: series.length, maxGap, minGap, meanGap, totalValue1, totalValue2 },
    colorsMapping: input.colorsMapping,
    summary,
  };
}
