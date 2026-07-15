// Renderer-agnostic semantic context for FountainChart. Derived from the DATA
// model (not the DOM) so SVG and canvas yield identical context. Surfaces the
// per-jet value/spread/uncertainty plus dataset stats and a deterministic
// summary the insights/a11y layers read for free.
import { isPredicted } from "../math/provenance";
import { parseXValue } from "../lineChart/lineUtils";
import { buildLegendData } from "./legend";
import type {
  FountainChartContext,
  FountainDataItem,
  FountainJetContext,
  FountainXAxisType,
  XaxisDataType,
} from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildFountainContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  mode: "snapshot" | "trend";
  xAxisType: FountainXAxisType;
  items: FountainDataItem[];
  labels: string[];
  xDomain: [number, number];
  yAxisDomain: [number, number];
  colorsMapping: Record<string, string>;
}

/** Slope of a least-squares line through values indexed 0..n-1. */
function regressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += i;
    sy += values[i];
    sxx += i * i;
    sxy += i * values[i];
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return 0;
  return (n * sxy - sx * sy) / denom;
}

export function buildFountainContext(input: BuildFountainContextInput): FountainChartContext {
  // In trend mode, order jets by their parsed date so trendSlope and the a11y
  // table match the rendered left-to-right axis even for unsorted input.
  const items =
    input.mode === "trend" &&
    (input.xAxisType === "number" ||
      input.xAxisType === "date_annual" ||
      input.xAxisType === "date_monthly")
      ? [...input.items].sort((a, b) => {
          const pa = parseXValue(a.date ?? 0, input.xAxisType as XaxisDataType);
          const pb = parseXValue(b.date ?? 0, input.xAxisType as XaxisDataType);
          const na = typeof pa === "number" ? pa : pa.getTime();
          const nb = typeof pb === "number" ? pb : pb.getTime();
          return na - nb;
        })
      : input.items;

  const jets: FountainJetContext[] = items.map((d) => {
    const value = Number.isFinite(Number(d.value)) ? Number(d.value) : 0;
    const spread = Number.isFinite(Number(d.spread)) ? Math.abs(Number(d.spread)) : 0;
    const spreadRatio = value !== 0 ? spread / value : spread > 0 ? 1 : 0;
    return {
      label: d.label,
      code: d.code,
      color: input.colorsMapping[d.label] ?? "",
      value: round(value),
      spread: round(spread),
      upperBound: round(value + spread),
      spreadRatio: round(spreadRatio),
      lean:
        d.lean === undefined || d.lean === null || !Number.isFinite(Number(d.lean))
          ? null
          : round(Math.min(1, Math.max(-1, Number(d.lean)))),
      predicted: isPredicted({ date: d.date ?? 0, certainty: d.certainty, predicted: d.predicted }),
      xPosition: input.mode === "trend" ? (d.date ?? null) : null,
    };
  });

  const values = jets.map((j) => j.value);
  let tallest: { label: string; value: number } | null = null;
  let frothiest: { label: string; spreadRatio: number } | null = null;
  let predictedCount = 0;
  for (const j of jets) {
    if (!tallest || j.value > tallest.value) tallest = { label: j.label, value: j.value };
    if (!frothiest || j.spreadRatio > frothiest.spreadRatio)
      frothiest = { label: j.label, spreadRatio: j.spreadRatio };
    if (j.predicted) predictedCount++;
  }
  const valueRange: [number, number] | null =
    values.length > 0 ? [round(Math.min(...values)), round(Math.max(...values))] : null;
  const trendSlope = input.mode === "trend" ? round(regressionSlope(values)) : null;

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary: string;
  if (jets.length === 0) {
    summary = `Fountain chart ${titlePart}with no jets.`;
  } else if (input.mode === "trend") {
    const dir =
      trendSlope === null || Math.abs(trendSlope) < 1e-9
        ? "flat"
        : trendSlope > 0
          ? "rising"
          : "falling";
    const peak = tallest ? `${tallest.value} (${tallest.label})` : "n/a";
    summary =
      `Fountain chart ${titlePart}over ${jets.length} period${jets.length === 1 ? "" : "s"}: ` +
      `${dir} trend (slope ${trendSlope}). Peak ${peak}.` +
      (frothiest
        ? ` Most uncertain: ${frothiest.label} (spread ratio ${frothiest.spreadRatio}).`
        : "");
  } else if (jets.length === 1) {
    const j = jets[0];
    const pct = Math.round(j.spreadRatio * 100);
    summary = `Fountain chart ${titlePart}for ${j.label}: value ${j.value}, spread +/-${j.spread} (${pct}% uncertainty).`;
  } else {
    summary =
      `Fountain chart ${titlePart}with ${jets.length} jets.` +
      (tallest ? ` Tallest: ${tallest.label} at ${tallest.value}.` : "") +
      (frothiest
        ? ` Most uncertain: ${frothiest.label} (spread ratio ${frothiest.spreadRatio}).`
        : "");
  }

  const headers =
    input.mode === "trend"
      ? ["Period", "Series", "Value", "Spread"]
      : ["Label", "Value", "Spread", "Spread ratio"];
  const rows: Array<Array<string | number>> = items.map((d, i) => {
    const j = jets[i];
    return input.mode === "trend"
      ? [String(d.date ?? ""), j.label, j.value, j.spread]
      : [j.label, j.value, j.spread, j.spreadRatio];
  });

  // Snapshot mode: one legend row per jet (categories). Trend mode is a single
  // conceptual series over time - per-period legend rows would be noise.
  const legendData =
    input.mode === "snapshot"
      ? buildLegendData({ labels: jets.map((j) => j.label), colorsMapping: input.colorsMapping })
      : undefined;

  return {
    chartType: "fountain-chart",
    title: input.title,
    renderer: input.renderer,
    mode: input.mode,
    xAxis: { type: input.xAxisType, domain: input.mode === "trend" ? input.xDomain : input.labels },
    yAxis: { domain: input.yAxisDomain },
    jets,
    legendData,
    stats: {
      jetCount: jets.length,
      tallest,
      frothiest,
      trendSlope,
      valueRange,
      predictedCount,
    },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: { headers, rows },
  };
}
