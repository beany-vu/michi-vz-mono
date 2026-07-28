// Renderer-agnostic semantic context for Gauge. Derived from the processed
// rings (not the DOM), so SVG, canvas, and webgpu produce identical context.
import type { GaugeRing } from "../gaugeChart/data";
import type { GaugeChartContext, GaugeRingContext } from "../types";
import { buildLegendData } from "./legend";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildGaugeContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  rings: GaugeRing[];
  max: number;
  colorsMapping: Record<string, string>;
  valueFormatter?: (v: number) => string;
}

export function buildGaugeContext(input: BuildGaugeContextInput): GaugeChartContext {
  const fmt = input.valueFormatter ?? ((v: number) => `${round(v)}%`);

  const rings: GaugeRingContext[] = input.rings.map((r, i) => ({
    label: r.label,
    code: r.code,
    color: input.colorsMapping[r.label] ?? "",
    value: r.value === null ? null : round(r.value),
    fraction: r.fraction === null ? null : round(r.fraction),
    index: i,
  }));

  let largestRing: { label: string; value: number } | null = null;
  for (const r of rings) {
    if (r.value !== null && (!largestRing || r.value > largestRing.value)) {
      largestRing = { label: r.label, value: r.value };
    }
  }

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Gauge chart ${titlePart}with ${rings.length} ring${rings.length === 1 ? "" : "s"} (max ${input.max}).`;
  if (largestRing) {
    summary += ` Largest: ${largestRing.label} (${fmt(largestRing.value)}).`;
  }

  const headers = ["Label", "Value"];
  const rows = rings.map((r) => [r.label, r.value === null ? "n/a" : fmt(r.value)]);

  const legendData = buildLegendData({
    labels: rings.map((r) => r.label),
    colorsMapping: input.colorsMapping,
  });

  return {
    chartType: "gauge-chart",
    title: input.title,
    renderer: input.renderer,
    max: input.max,
    rings,
    legendData,
    stats: {
      ringCount: rings.length,
      largestRing,
    },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: { headers, rows },
  };
}
