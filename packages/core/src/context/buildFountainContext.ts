// Renderer-agnostic semantic context for FountainChart (SPEC section 7, audit
// fountain #8). Derived from the RESOLVED jets (not the DOM), so every renderer
// yields the same context. Per jet: the value (big dot), the range [low, high], how
// many measurements back it and how many sit on the good side of each reference
// line. Stats, a plain-words summary and the a11y table say what the picture shows.
import { buildLegendData } from "./legend";
import {
  defaultCountLabel,
  fountainAxisLabel,
  fountainReferenceCounts,
  resolveFountainWords,
} from "../fountainChart/labels";
import type { FountainWords } from "../fountainChart/labels";
import type { FountainResolvedJet } from "../fountainChart/data";
import type {
  FountainChartContext,
  FountainDataItem,
  FountainJetContext,
  FountainReferenceLine,
  FountainXAxisType,
} from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;
const roundOrNull = (n: number | null): number | null => (n === null ? null : round(n));

export interface BuildFountainContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  mode: "snapshot" | "trend";
  xAxisType: FountainXAxisType;
  /** The drawn jets (resolveFountainData(...).jets) */
  jets: FountainResolvedJet[];
  /** Every label of the dataSet in first-seen order (legend slots, disabled included) */
  allLabels: string[];
  /** The drawn labels (the snapshot x domain) */
  labels: string[];
  disabledItems?: string[];
  /** [min, max] x in trend mode */
  xDomain: [number, number];
  /** The y domain the axis shows (niced) */
  yAxisDomain: [number, number];
  /** label -> colour (generatedColorsMapping) */
  colorsMapping: Record<string, string>;
  /** Per-jet colour (FountainColorResolver.colorOf); defaults to colorsMapping[label] */
  colorOf?: (item: FountainDataItem) => string;
  referenceLines?: FountainReferenceLine[];
  /** UI words for the a11y headers and cells (default English) */
  words?: FountainWords;
  /** A trend jet's period as text (default: String(date)) */
  formatPeriod?: (jet: FountainResolvedJet) => string;
}

/** The x of a trend jet in the axis's own unit: years for date_annual, months for
 * date_monthly, the number itself otherwise (so the slope reads "per period"). */
function periodUnit(x: number, type: FountainXAxisType): number {
  if (type === "date_annual") return new Date(x).getUTCFullYear();
  if (type === "date_monthly") {
    const d = new Date(x);
    return d.getUTCFullYear() * 12 + d.getUTCMonth();
  }
  return x;
}

/** Least-squares slope of y over x. */
function slopeOf(points: Array<[number, number]>): number {
  const n = points.length;
  if (n < 2) return 0;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const [x, y] of points) {
    sx += x;
    sy += y;
    sxx += x * x;
    sxy += x * y;
  }
  const denom = n * sxx - sx * sx;
  return denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
}

export function buildFountainContext(input: BuildFountainContextInput): FountainChartContext {
  const words = input.words ?? resolveFountainWords({});
  const isTrend = input.mode === "trend";
  // Trend rows follow the axis left to right, whatever the input order.
  const jets = isTrend
    ? [...input.jets].sort((a, b) => (a.x ?? 0) - (b.x ?? 0) || a.index - b.index)
    : input.jets;
  const periodOf = (j: FountainResolvedJet): string =>
    input.formatPeriod ? input.formatPeriod(j) : String(j.date ?? "");

  const jetContexts: FountainJetContext[] = jets.map((j) => {
    const range = j.low !== null && j.high !== null ? j.high - j.low : null;
    const rangeRatio = range !== null && j.value !== 0 ? range / Math.abs(j.value) : null;
    return {
      label: j.label,
      code: j.code,
      color: input.colorOf ? input.colorOf(j.item) : (input.colorsMapping[j.label] ?? ""),
      value: round(j.value),
      low: roundOrNull(j.low),
      high: roundOrNull(j.high),
      range: roundOrNull(range),
      rangeRatio: roundOrNull(rangeRatio),
      sampleCount: j.samples.length,
      referenceCounts: fountainReferenceCounts(j, input.referenceLines),
      predicted: j.forecast,
      xPosition: isTrend ? j.date : null,
      spread: range !== null ? round(range / 2) : 0,
      spreadRatio: rangeRatio !== null ? round(rangeRatio / 2) : 0,
      upperBound: round(j.high ?? j.value),
      lean: null,
    };
  });

  // Stats (strictly greater wins, so ties keep the first jet in axis order).
  let tallestI = -1;
  let widestI = -1;
  let ratioI = -1;
  let predictedCount = 0;
  jetContexts.forEach((j, i) => {
    if (tallestI < 0 || j.value > jetContexts[tallestI].value) tallestI = i;
    if (j.range !== null && (widestI < 0 || j.range > (jetContexts[widestI].range ?? -1))) {
      widestI = i;
    }
    if (
      j.rangeRatio !== null &&
      (ratioI < 0 || j.rangeRatio > (jetContexts[ratioI].rangeRatio ?? -1))
    ) {
      ratioI = i;
    }
    if (j.predicted) predictedCount++;
  });
  const tallest =
    tallestI >= 0
      ? { label: jetContexts[tallestI].label, value: jetContexts[tallestI].value }
      : null;
  const widestRange =
    widestI >= 0
      ? { label: jetContexts[widestI].label, range: jetContexts[widestI].range as number }
      : null;
  const frothiest =
    ratioI >= 0
      ? { label: jetContexts[ratioI].label, spreadRatio: jetContexts[ratioI].spreadRatio }
      : null;
  const values = jetContexts.map((j) => j.value);
  const valueRange: [number, number] | null =
    values.length > 0 ? [Math.min(...values), Math.max(...values)] : null;
  const seriesCount = new Set(jets.map((j) => j.label)).size;
  const trendSlope =
    isTrend && seriesCount === 1
      ? round(slopeOf(jets.map((j) => [periodUnit(j.x ?? 0, input.xAxisType), j.value])))
      : null;

  // Summary, in plain words.
  const titlePart = input.title ? `"${input.title}" ` : "";
  const nameOf = (i: number): string =>
    isTrend ? `${jetContexts[i].label} (${periodOf(jets[i])})` : jetContexts[i].label;
  const widestPart =
    widestI >= 0
      ? ` Widest range: ${nameOf(widestI)}, from ${jetContexts[widestI].low} to ${jetContexts[widestI].high}.`
      : "";
  let summary: string;
  if (jetContexts.length === 0) {
    summary = `Fountain chart ${titlePart}with no jets.`;
  } else if (isTrend) {
    const periods = new Set(jets.map((j) => j.x)).size;
    const dir =
      trendSlope === null
        ? ""
        : Math.abs(trendSlope) < 1e-9
          ? ": flat"
          : trendSlope > 0
            ? ": rising"
            : ": falling";
    const t = jetContexts[tallestI];
    summary =
      `Fountain chart ${titlePart}over ${periods} period${periods === 1 ? "" : "s"}${dir}. ` +
      `Peak ${t.value} (${t.label}, ${periodOf(jets[tallestI])}).` +
      widestPart;
  } else if (jetContexts.length === 1) {
    const j = jetContexts[0];
    const parts = [`usual ${j.value}`];
    if (j.low !== null && j.high !== null) parts.push(`from ${j.low} to ${j.high}`);
    if (j.sampleCount > 0) parts.push(`${j.sampleCount} ${words.sampleWord}`);
    summary = `Fountain chart ${titlePart}for ${j.label}: ${parts.join(", ")}.`;
  } else {
    summary =
      `Fountain chart ${titlePart}with ${jetContexts.length} jets. ` +
      `Highest usual value: ${tallest!.label} at ${tallest!.value}.` +
      widestPart;
  }

  // a11y table: numbers stay numbers; missing cells are "".
  const counted = (input.referenceLines ?? []).filter(
    (l) => l.goodSide && Number.isFinite(Number(l.value)),
  );
  const countHeaders = counted.map((l) => l.countLabel ?? defaultCountLabel(l.goodSide!));
  const headers = [
    ...(isTrend ? ["Period"] : []),
    "Label",
    "Usual",
    words.low,
    words.high,
    "Samples",
    ...countHeaders,
  ];
  const rows: Array<Array<string | number>> = jets.map((j, i) => {
    const c = jetContexts[i];
    const counts = counted.map((line) => {
      const hit = c.referenceCounts.find(
        (rc) => rc.value === Number(line.value) && rc.goodSide === line.goodSide,
      );
      return hit ? `${hit.count} ${words.of} ${hit.total}` : "";
    });
    return [
      ...(isTrend ? [periodOf(j)] : []),
      fountainAxisLabel(c.label, c.predicted, words),
      c.value,
      c.low ?? "",
      c.high ?? "",
      c.sampleCount,
      ...counts,
    ];
  });

  // Legend: every label keeps its slot (disabled ones flagged). Trend mode shows one
  // only when several series share the chart.
  const legendData =
    !isTrend || input.allLabels.length > 1
      ? buildLegendData({
          labels: input.allLabels,
          colorsMapping: input.colorsMapping,
          disabledItems: input.disabledItems,
        })
      : undefined;

  return {
    chartType: "fountain-chart",
    title: input.title,
    renderer: input.renderer,
    mode: input.mode,
    xAxis: { type: input.xAxisType, domain: isTrend ? input.xDomain : input.labels },
    yAxis: { domain: input.yAxisDomain },
    jets: jetContexts,
    legendData,
    stats: {
      jetCount: jetContexts.length,
      tallest,
      widestRange,
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
