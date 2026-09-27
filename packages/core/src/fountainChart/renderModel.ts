// The ONE FountainChart render model: every renderer (svg, canvas, webgpu) draws
// exactly this, so they cannot disagree about where a mark is. Plain pixel numbers
// and point arrays only, never path strings (each renderer formats its own).
//
// Per jet (SPEC section 4):
// - stem: a bar from the baseline (0, the lake) to the big dot; dashed for a forecast;
// - bell: the fountain, a polygon spanning exactly [y(high), y(low)], or null when
//   the jet has no range, ranges are off, or the range is under half a pixel tall;
// - dots: one small dot per sample at its exact y, packed inside the bell (none for
//   a forecast, or when samples or ranges are off);
// - bigDot: the value, hollow for a forecast;
// - valueLabels / referenceCounts: the words under the x label (labels.ts);
// - painted: the box every mark of the jet covers (painted.x1 = the timeline reveal).
// Plus the lake, the reference lines, the trend line through the big dots and, in
// trend mode, each period's reveal edge.
//
// A user yAxisDomain can leave data outside the plot: stems, big dots and bells are
// clamped to the plot edge (checkFountainDomain warns), dots outside are dropped.
import { sanitizeForClassName } from "../math/sanitize";
import {
  bellOutline,
  fountainBigDotRadius,
  fountainHalfWidth,
  fountainStemWidth,
  packFountainDots,
  FOUNTAIN_DOT_RADIUS,
  type PackedDot,
} from "./geometry";
import {
  defaultCountLabel,
  fountainGuideMarks,
  fountainReadingGuide,
  fountainReferenceCounts,
  fountainValueLabels,
  type FountainValueLabel,
  type FountainWords,
} from "./labels";
import type { FountainResolvedJet, ResolvedFountainData } from "./data";
import type { FountainPlot, FountainScales } from "./scales";
import type { FountainColorResolver } from "./colors";
import type { FountainDataItem, FountainReferenceCount, FountainReferenceLine } from "../types";

export interface FountainPoint {
  x: number;
  y: number;
}

/** The bar from the baseline to the big dot. */
export interface FountainStemModel {
  x: number;
  /** The baseline end (0, the lake; clamped to the plot) */
  y0: number;
  /** The big dot end */
  y1: number;
  width: number;
  /** A forecast: draw a dashed line instead of a solid bar */
  dashed: boolean;
}

/** The fountain: a bell of falling water over [low, high]. */
export interface FountainBellModel {
  /** Closed outline, [x, y] pairs: up the left side from the base, down the right side */
  points: Array<[number, number]>;
  /** A forecast: dashed outline, lighter fill */
  dashed: boolean;
  /** y of the tip (high) */
  top: number;
  /** y of the flat base (low) */
  bottom: number;
  /** Half-width at the base */
  half: number;
}

/** One small dot: one real measurement. */
export interface FountainDotModel {
  x: number;
  y: number;
  r: number;
  /** The sample it stands for */
  value: number;
}

/** The big dot: the number to quote. */
export interface FountainBigDotModel {
  x: number;
  y: number;
  r: number;
  /** A forecast: white fill, colour stroke */
  hollow: boolean;
}

export interface FountainJetModel {
  /** The source data item (for the tooltip formatter) */
  item: FountainDataItem;
  /** Index of the item in the dataSet */
  index: number;
  label: string;
  code?: string;
  /** sanitizeForClassName(label): the data-label-safe CSS hook */
  safe: string;
  /** colorsMapping[label] ?? item.color ?? the label's palette colour */
  color: string;
  value: number;
  low: number | null;
  high: number | null;
  /** Every finite sample of the jet, ascending (the data; `dots` are the drawn ones) */
  samples: number[];
  forecast: boolean;
  /** Another label is highlighted */
  dimmed: boolean;
  /** The raw date in trend mode, else null */
  date: number | string | null;
  /** Centre x (the stem) */
  x: number;
  /** The jet's column: [x - slot / 2, x + slot / 2] */
  slot: { x0: number; x1: number };
  stem: FountainStemModel;
  bell: FountainBellModel | null;
  dots: FountainDotModel[];
  bigDot: FountainBigDotModel;
  /** Lines under the x label ([] when showValueLabels is off) */
  valueLabels: FountainValueLabel[];
  /** One per reference line with a goodSide ([] without samples or for a forecast) */
  referenceCounts: FountainReferenceCount[];
  /** Box covering every mark of the jet; x1 is the timeline reveal edge */
  painted: { x0: number; x1: number; y0: number; y1: number };
}

export interface FountainReferenceLineModel {
  value: number;
  y: number;
  /** Printed at the right end */
  label?: string;
  x0: number;
  x1: number;
  goodSide?: "below" | "above";
  /** Resolved count words (only with a goodSide) */
  countLabel?: string;
}

/** A trend period: where its jets sit and how far the timeline must reveal to show them. */
export interface FountainPeriodModel {
  date: number | string;
  /** Centre x of the period */
  x: number;
  /** Painted right edge of the period's jets */
  revealPx: number;
}

export interface FountainRenderModel {
  mode: "snapshot" | "trend";
  plot: FountainPlot;
  /** Per-jet column width */
  slotWidth: number;
  /** y of 0 (clamped to the plot): where stems start */
  baselineY: number;
  /** The lake: a subtle band at the baseline across the plot (a theme token, not data) */
  lake: { y: number; x0: number; x1: number };
  jets: FountainJetModel[];
  referenceLines: FountainReferenceLineModel[];
  /** Points through the big dots, left to right; null when off or fewer than 2 */
  trendLine: FountainPoint[] | null;
  /** Trend mode: every period, ascending ([] in snapshot mode) */
  periods: FountainPeriodModel[];
  /** The reading guide under the plot (unwrapped), or null. The default names only the
   * marks the chart draws. */
  readingGuide: string | null;
}

/**
 * Each jet's packed small dots from the last render, by jet index, with the inputs
 * that placed them. The engine keeps one per chart, so an update that moves no dot
 * (highlightItems on every hover, a colour) does not pack every bell again.
 */
export type FountainDotCache = Map<number, { key: string; dots: PackedDot[] }>;

export interface BuildFountainModelOptions {
  /** Draw the fountain (default true); false = stem and big dot only */
  showRange?: boolean;
  /** Draw the small dots (default true) */
  showSamples?: boolean;
  /** Build the value label lines (default true) */
  showValueLabels?: boolean;
  /** Lean the tops downwind (default false) */
  drift?: boolean;
  /** Line through the big dots (default: on in trend mode with one series, else off) */
  showTrendLine?: boolean;
  highlightItems?: string[];
  referenceLines?: FountainReferenceLine[];
  readingGuide?: boolean | string;
  /** Number formatter for the value labels (fountainValueFormatter) */
  format: (n: number) => string;
  /** UI words (resolveFountainWords) */
  words: FountainWords;
  /** Reuse (and refresh) packed small dots between renders */
  dotCache?: FountainDotCache;
}

/** Where one jet's fountain and small dots go (fountainJetMarks). */
export interface FountainJetMarks {
  /** y of the tip (high) and of the base (low), clamped to the plot */
  top: number;
  bottom: number;
  /** The fountain is drawn: at least half a pixel tall */
  bell: boolean;
  /** The samples drawn as small dots: those inside the plot */
  samples: number[];
}

/**
 * Where one jet's fountain and small dots go under these scales, or null when it draws
 * neither (no range, or showRange off). Its samples are drawn as small dots while
 * showSamples is on and the jet is not a forecast, those outside the plot left out.
 * The render model draws exactly this; the frame reads it to know which marks the
 * reading guide names before the model is built.
 */
export function fountainJetMarks(
  j: Pick<FountainResolvedJet, "low" | "high" | "samples" | "forecast">,
  scales: Pick<FountainScales, "plot" | "yScale">,
  o: { showRange: boolean; showSamples: boolean },
): FountainJetMarks | null {
  if (!o.showRange || j.low === null || j.high === null) return null;
  const { plot, yScale } = scales;
  const clampY = (y: number): number => Math.min(plot.bottom, Math.max(plot.top, y));
  const inPlot = (y: number): boolean => y >= plot.top - 1e-9 && y <= plot.bottom + 1e-9;
  const top = clampY(yScale(j.high));
  const bottom = clampY(yScale(j.low));
  const samples = o.showSamples && !j.forecast ? j.samples.filter((s) => inPlot(yScale(s))) : [];
  return { top, bottom, bell: bottom - top > 0.5, samples };
}

export function buildFountainRenderModel(
  resolved: ResolvedFountainData,
  scales: FountainScales,
  colors: FountainColorResolver,
  o: BuildFountainModelOptions,
): FountainRenderModel {
  const { plot, yScale, slotWidth } = scales;
  const showRange = o.showRange !== false;
  const showSamples = o.showSamples !== false;
  const showValueLabels = o.showValueLabels !== false;
  const drift = o.drift === true;
  const highlight = new Set(o.highlightItems ?? []);
  const clampY = (y: number): number => Math.min(plot.bottom, Math.max(plot.top, y));

  const baselineY = clampY(yScale(0));
  const stemWidth = fountainStemWidth(slotWidth);
  const bigR = fountainBigDotRadius(slotWidth);

  const jets: FountainJetModel[] = resolved.jets.map((j) => {
    const x = scales.xOf(j);
    const valueY = clampY(yScale(j.value));
    const marks = fountainJetMarks(j, scales, { showRange, showSamples });
    // The bell's width follows every sample it stands for, drawn or clipped.
    const half = fountainHalfWidth(
      marks && showSamples && !j.forecast ? j.samples.length : 0,
      slotWidth,
    );

    let bell: FountainBellModel | null = null;
    let dots: FountainDotModel[] = [];
    if (marks) {
      const { top, bottom } = marks;
      const shape = { cx: x, yTop: top, yBottom: bottom, half, drift };
      if (marks.bell) {
        bell = { points: bellOutline(shape), dashed: j.forecast, top, bottom, half };
      }
      const drawn = marks.samples;
      const bellIn = { ...shape, valueY, baselineY, bigR };
      // Everything the packing reads: the bell, the big dot, the stem, the y scale and
      // the samples.
      const key = drawn.length
        ? [
            x,
            top,
            bottom,
            half,
            drift ? 1 : 0,
            valueY,
            baselineY,
            bigR,
            yScale.domain().join(","),
            yScale.range().join(","),
            drawn.join(","),
          ].join("|")
        : "";
      const hit = o.dotCache?.get(j.index);
      const packed =
        hit && hit.key === key ? hit.dots : packFountainDots(drawn, (v) => yScale(v), bellIn);
      o.dotCache?.set(j.index, { key, dots: packed });
      dots = packed.map((d) => ({
        x: d.x,
        y: d.y,
        r: FOUNTAIN_DOT_RADIUS,
        value: d.value,
      }));
    }

    const stem: FountainStemModel = {
      x,
      y0: baselineY,
      y1: valueY,
      width: stemWidth,
      dashed: j.forecast,
    };
    const bigDot: FountainBigDotModel = { x, y: valueY, r: bigR, hollow: j.forecast };

    // Painted box: every mark of the jet.
    let x0 = Math.min(x - stemWidth / 2, x - bigR);
    let x1 = Math.max(x + stemWidth / 2, x + bigR);
    let y0 = Math.min(stem.y0, stem.y1, valueY - bigR);
    let y1 = Math.max(stem.y0, stem.y1, valueY + bigR);
    for (const [px, py] of bell?.points ?? []) {
      x0 = Math.min(x0, px);
      x1 = Math.max(x1, px);
      y0 = Math.min(y0, py);
      y1 = Math.max(y1, py);
    }
    for (const d of dots) {
      x0 = Math.min(x0, d.x - d.r);
      x1 = Math.max(x1, d.x + d.r);
      y0 = Math.min(y0, d.y - d.r);
      y1 = Math.max(y1, d.y + d.r);
    }

    return {
      item: j.item,
      index: j.index,
      label: j.label,
      code: j.code,
      safe: sanitizeForClassName(j.label),
      color: colors.colorOf(j.item),
      value: j.value,
      low: j.low,
      high: j.high,
      samples: j.samples,
      forecast: j.forecast,
      dimmed: highlight.size > 0 && !highlight.has(j.label),
      date: j.date,
      x,
      slot: { x0: x - slotWidth / 2, x1: x + slotWidth / 2 },
      stem,
      bell,
      dots,
      bigDot,
      valueLabels: showValueLabels
        ? fountainValueLabels(j, {
            format: o.format,
            words: o.words,
            referenceLines: o.referenceLines,
            showRange,
          })
        : [],
      referenceCounts: fountainReferenceCounts(j, o.referenceLines),
      painted: { x0, x1, y0, y1 },
    };
  });

  // Forget the jets this render no longer draws.
  if (o.dotCache) {
    const drawnIndexes = new Set(resolved.jets.map((j) => j.index));
    for (const index of [...o.dotCache.keys()]) {
      if (!drawnIndexes.has(index)) o.dotCache.delete(index);
    }
  }

  const referenceLines: FountainReferenceLineModel[] = [];
  for (const line of o.referenceLines ?? []) {
    const value = Number(line.value);
    if (!Number.isFinite(value)) continue;
    const y = yScale(value);
    if (y < plot.top - 0.5 || y > plot.bottom + 0.5) continue;
    const m: FountainReferenceLineModel = {
      value,
      y,
      label: line.label,
      x0: plot.left,
      x1: plot.right,
    };
    if (line.goodSide) {
      m.goodSide = line.goodSide;
      m.countLabel = line.countLabel ?? defaultCountLabel(line.goodSide);
    }
    referenceLines.push(m);
  }

  // Default: on in trend mode with one series; off with several (one line through
  // every big dot would zig-zag between the series) and in snapshot mode.
  const wantTrend =
    o.showTrendLine ??
    (resolved.mode === "trend" && new Set(resolved.jets.map((j) => j.label)).size <= 1);
  let trendLine: FountainPoint[] | null = null;
  if (wantTrend && jets.length >= 2) {
    trendLine = jets
      .map((j, i) => ({ i, x: j.bigDot.x, y: j.bigDot.y }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      .sort((a, b) => a.x - b.x || a.i - b.i)
      .map(({ x, y }) => ({ x, y }));
    if (trendLine.length < 2) trendLine = null;
  }

  const periods: FountainPeriodModel[] = resolved.periods.map((p) => {
    const at = jets.filter((j, i) => resolved.jets[i].x === p.x);
    const x = at.length ? at[0].x : scales.xOf({ label: "", x: p.x });
    const revealPx = at.reduce((m, j) => Math.max(m, j.painted.x1), x);
    return { date: p.date, x, revealPx };
  });

  return {
    mode: resolved.mode,
    plot,
    slotWidth,
    baselineY,
    lake: { y: baselineY, x0: plot.left, x1: plot.right },
    jets,
    referenceLines,
    trendLine,
    periods,
    readingGuide: fountainReadingGuide(o.readingGuide, fountainGuideMarks(jets)),
  };
}
