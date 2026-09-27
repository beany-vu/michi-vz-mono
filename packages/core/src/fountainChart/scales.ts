// FountainChart scales (pure). Linear y; band x in snapshot mode (one column per
// label, tiling the plot) or linear/time x in trend mode (jets at their periods,
// the range inset by half a slot on each side so the first and last fountains stay
// inside the plot; audit fountain #10). The slot width is each jet's pixel budget:
// the fountain's half-width is capped at 32% of it, so neighbours never touch.
import { scaleBand, scaleLinear, scaleTime } from "d3-scale";
import type { ScaleBand, ScaleLinear, ScaleTime } from "d3-scale";
import type { FountainPeriod, FountainResolvedJet } from "./data";
import type { FountainReferenceLine, Margin, XaxisDataType } from "../types";

export type FountainXScale =
  ScaleBand<string> | ScaleLinear<number, number> | ScaleTime<number, number>;

/** The plot box in pixels (inside the margins). */
export interface FountainPlot {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface FountainScales {
  mode: "snapshot" | "trend";
  /** The plot box the scales map onto */
  plot: FountainPlot;
  /** band scale in snapshot mode, null in trend mode */
  xBand: ScaleBand<string> | null;
  /** linear/time scale in trend mode (range already inset), null in snapshot mode */
  xLinear: ScaleLinear<number, number> | ScaleTime<number, number> | null;
  yScale: ScaleLinear<number, number>;
  /** Per-jet horizontal pixel budget: the band step (snapshot) or the trend slot */
  slotWidth: number;
  /** Pixel x of a jet's centre: its column (snapshot) or its period (trend) */
  xOf: (jet: Pick<FountainResolvedJet, "label" | "x">) => number;
}

export interface FountainYDomainOptions {
  /** Reference line values are always inside the auto domain */
  referenceLines?: ReadonlyArray<Pick<FountainReferenceLine, "value">>;
  /** false: ranges are not drawn, so they do not stretch the domain (default true) */
  showRange?: boolean;
  /** A user domain wins and is returned as given */
  yAxisDomain?: [number, number];
}

/**
 * The y domain before rounding: a user `yAxisDomain` as given, else [min, max] over 0,
 * every value, every low/high (when ranges show) and every reference line, with 10%
 * headroom on each side that holds data (so the tip and the big dot never touch the
 * frame). [0, 1] when there is nothing to show.
 */
export function fountainYDomain(
  jets: ReadonlyArray<Pick<FountainResolvedJet, "value" | "low" | "high">>,
  o: FountainYDomainOptions = {},
): [number, number] {
  if (o.yAxisDomain) return [o.yAxisDomain[0], o.yAxisDomain[1]];
  const showRange = o.showRange !== false;
  let lo = 0;
  let hi = 0;
  const take = (v: number | null | undefined): void => {
    if (v === null || v === undefined || !Number.isFinite(v)) return;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  };
  for (const j of jets) {
    take(j.value);
    if (showRange) {
      take(j.low);
      take(j.high);
    }
  }
  for (const r of o.referenceLines ?? []) take(Number(r.value));
  if (lo === 0 && hi === 0) return [0, 1];
  return [lo + lo / 10, hi + hi / 10];
}

/**
 * Trend slot width for periods at xs (any order) across a plot `plotWidth` px wide,
 * with the x range inset by half a slot on each side: s = W * g / (D + g), where g
 * is the smallest gap between periods and D the span. Even periods give W / n. One
 * period (or none) gets the whole plot.
 */
export function fountainTrendSlot(xs: ReadonlyArray<number>, plotWidth: number): number {
  const sorted = [...new Set(xs.filter((x) => Number.isFinite(x)))].sort((a, b) => a - b);
  const W = Math.max(1, plotWidth);
  if (sorted.length < 2) return W;
  let g = Infinity;
  for (let i = 1; i < sorted.length; i++) g = Math.min(g, sorted[i] - sorted[i - 1]);
  const D = sorted[sorted.length - 1] - sorted[0];
  return (W * g) / (D + g);
}

export interface BuildFountainScalesInput {
  mode: "snapshot" | "trend";
  temporalType: XaxisDataType | null;
  /** Snapshot columns (the drawn labels, first-seen order) */
  labels: string[];
  /** Trend periods (ascending) */
  periods: ReadonlyArray<FountainPeriod>;
  /** From fountainYDomain */
  yDomain: [number, number];
  /** true when yDomain is the user's yAxisDomain: used as given, not rounded */
  yAxisDomainGiven?: boolean;
  /** Tick count the auto domain is rounded for (default 5) */
  ticks?: number;
  width: number;
  height: number;
  margin: Margin;
}

export function buildFountainScales(i: BuildFountainScalesInput): FountainScales {
  const plot: FountainPlot = {
    left: i.margin.left,
    right: Math.max(i.margin.left + 1, i.width - i.margin.right),
    top: i.margin.top,
    bottom: Math.max(i.margin.top + 1, i.height - i.margin.bottom),
  };
  const plotWidth = plot.right - plot.left;

  const yScale = scaleLinear().domain(i.yDomain).range([plot.bottom, plot.top]);
  if (!i.yAxisDomainGiven) yScale.nice(i.ticks ?? 5);

  let xBand: ScaleBand<string> | null = null;
  let xLinear: ScaleLinear<number, number> | ScaleTime<number, number> | null = null;
  let slotWidth: number;
  let xOf: FountainScales["xOf"];

  if (i.mode === "trend" && i.temporalType) {
    const xs = i.periods.map((p) => p.x);
    slotWidth = fountainTrendSlot(xs, plotWidth);
    const lo = xs.length ? Math.min(...xs) : 0;
    const hi = xs.length ? Math.max(...xs) : 1;
    const range: [number, number] = [plot.left + slotWidth / 2, plot.right - slotWidth / 2];
    if (i.temporalType === "number") {
      const lin = scaleLinear().domain([lo, hi]).range(range);
      xLinear = lin;
      xOf = (j) => lin(j.x ?? lo);
    } else {
      const time = scaleTime()
        .domain([new Date(lo), new Date(hi)])
        .range(range);
      xLinear = time;
      xOf = (j) => time(new Date(j.x ?? lo));
    }
  } else {
    const band = scaleBand<string>()
      .domain(i.labels)
      .range([plot.left, plot.right])
      .paddingInner(0.3)
      .paddingOuter(0.15);
    xBand = band;
    slotWidth = band.step();
    xOf = (j) => (band(j.label) ?? plot.left) + band.bandwidth() / 2;
  }

  return { mode: i.mode, plot, xBand, xLinear, yScale, slotWidth, xOf };
}

/**
 * Trend-mode x ticks: one per data period, ascending, first and last always included
 * (raw scaleTime().ticks() snaps to round dates and drops the first year in UTC+).
 * Built from the periods' parsed x, so every date form the data accepts gives its
 * tick (a year, "2021-01", epoch ms): the number itself on a number axis, else a Date.
 */
export function fountainPeriodTicks(
  periods: ReadonlyArray<FountainPeriod>,
  temporalType: XaxisDataType,
): Array<number | Date> {
  const xs = [...new Set(periods.map((p) => p.x).filter((x) => Number.isFinite(x)))].sort(
    (a, b) => a - b,
  );
  return temporalType === "number" ? xs : xs.map((x) => new Date(x));
}

// ---------------------------------------------------------------------------
// Deprecated pre-1.29 scales, kept so the old public export keeps working.

/** @deprecated since core 1.29: use buildFountainScales (inset trend range, xOf). */
export interface LegacyFountainScales {
  mode: "snapshot" | "trend";
  xBand: ScaleBand<string> | null;
  xLinear: ScaleLinear<number, number> | ScaleTime<number, number> | null;
  yScale: ScaleLinear<number, number>;
  slotWidth: number;
}

/** @deprecated since core 1.29: use buildFountainScales (inset trend range, xOf). */
export function createFountainScales(
  mode: "snapshot" | "trend",
  labels: string[],
  jetCount: number,
  xDomain: [number, number],
  yDomain: [number, number],
  width: number,
  height: number,
  margin: Margin,
  temporalType: XaxisDataType | null,
): LegacyFountainScales {
  const plotWidth = Math.max(1, width - margin.left - margin.right);
  let xBand: ScaleBand<string> | null = null;
  let xLinear: ScaleLinear<number, number> | ScaleTime<number, number> | null = null;
  let slotWidth: number;

  if (mode === "snapshot") {
    xBand = scaleBand<string>()
      .domain(labels)
      .range([margin.left, width - margin.right])
      .paddingInner(0.3)
      .paddingOuter(0.15);
    slotWidth = xBand.bandwidth();
  } else {
    if (temporalType === "number") {
      xLinear = scaleLinear()
        .domain([xDomain[0] || 0, xDomain[1] || 1])
        .range([margin.left, width - margin.right])
        .nice();
    } else {
      xLinear = scaleTime()
        .domain([new Date(xDomain[0]), new Date(xDomain[1])])
        .range([margin.left, width - margin.right]);
    }
    slotWidth = Math.max(8, (plotWidth / Math.max(1, jetCount)) * 0.9);
  }

  const yScale = scaleLinear()
    .domain([yDomain[0] || 0, yDomain[1] || 1])
    .range([height - margin.bottom, margin.top])
    .nice();

  return { mode, xBand, xLinear, yScale, slotWidth };
}
