// FountainChart frame (pure): the room the words around the plot need, decided BEFORE
// the final scales are built (SPEC section 4: "reserve bottom margin", "reserve right
// margin"). In order:
// - right: the widest wrapped reference line label;
// - left: the rotated y-axis title beside the tick labels;
// - bottom: the x labels (one line while they fit their column, else wrapped to up to
//   three lines, the rest drawn as axis notes, else tilted -45 deg with room for the
//   widest one's drop: chooseAxisMode on a band axis, autoRotate on a linear one),
//   then the value labels fitted to the column (layout.ts), then the reading guide
//   (wrapped between its rules).
// Everything that had to give way is reported as a layout-overflow warning: value
// labels left out (tilted x labels, a too-short chart), their end lines dropped
// (narrow columns), jets sharing a column, and columns under 24 px.
// Text widths come from an injected measure in the page's font (fountainHostMeasure in
// the engine), the same one the linear x-axis decides its tilt with.
import { chooseAxisMode, type AxisMode } from "../render/svg/chooseAxisMode";
import { HORIZONTAL_LABEL_OFFSET } from "../render/svg/xAxisBand";
import { defaultXAxisFormatter } from "../i18n/formatters";
import { buildFountainScales, type FountainScales } from "./scales";
import {
  fountainAxisLabel,
  fountainGuideMarks,
  fountainReadingGuide,
  fountainValueLabels,
  type FountainWords,
} from "./labels";
import {
  fitFountainValueLabels,
  fountainBottomLayout,
  fountainTextMeasure,
  fountainYTitleLayout,
  wrapFountainAxisLabel,
  wrapFountainGuide,
  wrapFountainReferenceLabel,
  FOUNTAIN_LABEL_FONT,
  FOUNTAIN_LABEL_LINE,
  FOUNTAIN_REFERENCE_LABEL_GAP,
  FOUNTAIN_REFERENCE_LABEL_WIDTH,
  type FountainBottomLayout,
  type FountainValueLabelFit,
} from "./layout";
import { fountainJetMarks } from "./renderModel";
import type { FountainResolvedJet, ResolvedFountainData } from "./data";
import type { DataWarning, FountainReferenceLine, Margin } from "../types";

/** Below this many px per jet a fountain cannot be read (the crowding warning). */
export const FOUNTAIN_MIN_SLOT = 24;
/** Baseline of the linear x-axis tick labels below the plot (renderXAxisLinear). */
const LINEAR_LABEL_BASELINE = 26;
/** Line height of an x label's wrapped lines (the axis notes). */
const AXIS_NOTE_LINE = 14;
/** chooseAxisMode keeps this much room between horizontal band labels. */
const BAND_LABEL_PAD = 8;
/** renderXAxisLinear keeps this much room between horizontal labels. */
const LINEAR_LABEL_PAD = 6;
/** renderXAxisLinear anchors a tilted (-45 deg) label this far below the plot. */
const LINEAR_TILT_OFFSET = 18;
/** Room under a tilted label's lowest point for its descenders. */
const TILT_DESCENDER_PAD = 12;

export interface FountainFrameInput {
  resolved: ResolvedFountainData;
  /** From fountainYDomain */
  yDomain: [number, number];
  /** True when yDomain is the user's yAxisDomain (used as given) */
  yAxisDomainGiven: boolean;
  width: number;
  height: number;
  /** The user's margins: the minimum; the words can only add to them */
  margin: Margin;
  ticks: number;
  words: FountainWords;
  /** Number format of the value labels */
  format: (n: number) => string;
  /** Format of the y tick labels (the y title sits left of them) */
  yFormat: (v: number) => string;
  xAxisFormat?: (d: number | string) => string;
  locale?: string;
  referenceLines?: ReadonlyArray<FountainReferenceLine>;
  showRange: boolean;
  /** Draw the small dots (default true); the default reading guide follows it */
  showSamples?: boolean;
  showValueLabels: boolean;
  yAxisTitle?: string;
  readingGuide?: boolean | string;
  /** Width in px of a text at the chart's base font size (12 px by default), in the
   * page's font (fountainHostMeasure) */
  measure: (text: string) => number;
  /** The same, bold (default: `measure` about 7% wider) */
  measureBold?: (text: string) => number;
}

/** How the x-axis draws its labels. */
export type FountainXAxisPlan =
  | {
      kind: "band";
      /** chooseAxisMode's decision ("horizontal" also when the labels wrap) */
      mode: AxisMode;
      tickValues: string[];
      /** The label drawn by the axis (the first line when the label wraps) */
      label: (label: string) => string;
    }
  | { kind: "linear"; label: (v: number) => string }
  | null;

export interface FountainFrame {
  /** The final margins (the user's, grown where the words need room) */
  margin: Margin;
  /** The final scales, built on those margins */
  scales: FountainScales;
  xAxis: FountainXAxisPlan;
  /** The fitted value labels (per drawn jet), or null when there are none */
  valueFit: FountainValueLabelFit | null;
  bottom: FountainBottomLayout;
  /** The reading guide wrapped to the chart width ([] = none) */
  guideLines: string[];
  /** Width the reference labels wrap to */
  referenceWidth: number;
  /** Baseline x of the rotated y-axis title, or null without one */
  yTitleX: number | null;
  /** The x labels' wrapped lines after the first, positioned */
  axisNotes: Array<{ x: number; y: number; text: string }>;
  warnings: DataWarning[];
}

const overflow = (message: string): DataWarning => ({ type: "layout-overflow", message });

export function planFountainFrame(i: FountainFrameInput): FountainFrame {
  const { resolved, words } = i;
  const measure = fountainTextMeasure(i.measure, i.measureBold);
  const warnings: DataWarning[] = [];
  const margin: Margin = { ...i.margin };
  const makeScales = (m: Margin): FountainScales =>
    buildFountainScales({
      mode: resolved.mode,
      temporalType: resolved.temporalType,
      labels: resolved.labels,
      periods: resolved.periods,
      yDomain: i.yDomain,
      yAxisDomainGiven: i.yAxisDomainGiven,
      ticks: i.ticks,
      width: i.width,
      height: i.height,
      margin: m,
    });

  // Right: the reference line labels.
  const referenceWidth = Math.min(FOUNTAIN_REFERENCE_LABEL_WIDTH, Math.max(40, i.width * 0.2));
  const refNeed = (i.referenceLines ?? []).reduce(
    (m, l) => Math.max(m, wrapFountainReferenceLabel(l.label, referenceWidth, measure).width),
    0,
  );
  if (refNeed > 0) {
    margin.right = Math.max(margin.right, Math.ceil(FOUNTAIN_REFERENCE_LABEL_GAP + refNeed + 4));
  }

  // Left: the rotated y-axis title beside the tick labels (the ticks depend on the
  // domain only, so any scale gives them).
  let tickLabelWidth = 0;
  if (i.yAxisTitle) {
    tickLabelWidth = makeScales(margin)
      .yScale.ticks(i.ticks)
      .reduce((m, v) => Math.max(m, i.measure(i.yFormat(v))), 0);
    const need = fountainYTitleLayout({
      maxTickLabelWidth: tickLabelWidth,
      marginLeft: margin.left,
    });
    margin.left = Math.max(margin.left, need.requiredLeft);
  }

  // The x layout is final now: the bottom margin only moves the plot bottom.
  let scales = makeScales(margin);

  // Bottom, 1: the x labels.
  const allForecast = (at: (j: FountainResolvedJet) => boolean): boolean => {
    const js = resolved.jets.filter(at);
    return js.length > 0 && js.every((j) => j.forecast);
  };
  const noteText = fountainAxisLabel("", true, words).trim();
  // Wrapped x labels; once one forecast word needs a line of its own, every forecast
  // label puts it there, so they read alike ("Fri" / "(forecast)" beside "Saturday" /
  // "(forecast)", not "Fri (forecast)").
  const forecastAlike = (
    labels: Array<{ text: string; forecast: boolean }>,
    avail: number,
  ): Array<string[] | null> => {
    const wrap = (l: { text: string; forecast: boolean }, ownLine: boolean) =>
      wrapFountainAxisLabel(l.text, l.forecast ? noteText : null, avail, i.measure, 3, ownLine);
    const first = labels.map((l) => wrap(l, false));
    const split = first.some(
      (w, k) => labels[k].forecast && w !== null && w.length > 1 && w[w.length - 1] === noteText,
    );
    if (!split) return first;
    return labels.map((l, k) => (l.forecast ? (wrap(l, true) ?? first[k]) : first[k]));
  };
  let extraLines: Array<{ at: number | string; lines: string[] }> = [];
  let axisBaseline = HORIZONTAL_LABEL_OFFSET;
  let labelsFlat = true;
  let xAxis: FountainXAxisPlan = null;
  if (resolved.mode === "trend" && scales.xLinear && resolved.temporalType) {
    // A number axis keeps the raw number (a year never becomes "2,001"), as the
    // tooltip and the a11y table do.
    const xFormat =
      i.xAxisFormat ??
      (resolved.temporalType === "number"
        ? (v: number | string) => String(v)
        : defaultXAxisFormatter(resolved.temporalType, i.locale));
    const isForecast = (v: number): boolean => allForecast((j) => j.x === v);
    const full = (v: number): string => fountainAxisLabel(xFormat(v), isForecast(v), words);
    let label = full;
    axisBaseline = LINEAR_LABEL_BASELINE;
    const avail = scales.slotWidth - LINEAR_LABEL_PAD;
    const periods = resolved.periods;
    labelsFlat = periods.every((p) => i.measure(full(p.x)) <= avail);
    if (!labelsFlat) {
      const wrapped = forecastAlike(
        periods.map((p) => ({ text: xFormat(p.x), forecast: isForecast(p.x) })),
        avail,
      );
      if (wrapped.every((w) => w !== null)) {
        const first = new Map(periods.map((p, k) => [p.x, wrapped[k]![0]]));
        label = (v) => first.get(v) ?? full(v);
        extraLines = periods.map((p, k) => ({ at: p.x, lines: wrapped[k]!.slice(1) }));
        labelsFlat = true;
      }
    }
    if (!labelsFlat) {
      // renderXAxisLinear (autoRotate) tilts them -45 deg, trailing down-left from 18 px
      // under the plot: reserve the widest one's drop, as the band axis does below.
      const widest = periods.reduce((m, p) => Math.max(m, i.measure(full(p.x))), 0);
      const required = Math.ceil(LINEAR_TILT_OFFSET + widest * Math.SQRT1_2 + TILT_DESCENDER_PAD);
      margin.bottom = Math.max(margin.bottom, required);
      axisBaseline = required - 10;
    }
    xAxis = { kind: "linear", label };
  } else if (scales.xBand) {
    const xFormat = i.xAxisFormat ?? ((d: number | string) => String(d));
    const isForecast = (l: string): boolean => allForecast((j) => j.label === l);
    const full = (l: string): string => fountainAxisLabel(xFormat(l), isForecast(l), words);
    let label = full;
    const domain = scales.xBand.domain();
    const step = scales.xBand.step();
    const flat = (a: { mode: AxisMode; tickValues: string[] }): boolean =>
      a.mode === "horizontal" && a.tickValues.length === domain.length;
    let axis: { mode: AxisMode; tickValues: string[] } = chooseAxisMode({
      domain,
      formatter: full,
      bandWidth: step,
      measure: i.measure,
    });
    if (!flat(axis)) {
      const wrapped = forecastAlike(
        domain.map((l) => ({ text: xFormat(l), forecast: isForecast(l) })),
        step - BAND_LABEL_PAD,
      );
      if (wrapped.every((w) => w !== null)) {
        const first = new Map(domain.map((l, k) => [l, wrapped[k]![0]]));
        label = (l) => first.get(l) ?? full(l);
        axis = { mode: "horizontal", tickValues: domain };
        extraLines = domain.map((l, k) => ({ at: l, lines: wrapped[k]!.slice(1) }));
      }
    }
    labelsFlat = flat(axis);
    if (axis.mode === "rotated") {
      const widest = axis.tickValues.reduce((m, v) => Math.max(m, i.measure(label(v))), 0);
      // 25 (axis offset) + 14 (label translate) + label·sin45 + 12 (descender pad)
      const required = Math.ceil(25 + 14 + widest * Math.SQRT1_2 + 12);
      margin.bottom = Math.max(margin.bottom, required);
      axisBaseline = required - 10;
    }
    xAxis = { kind: "band", mode: axis.mode, tickValues: axis.tickValues, label };
  }
  extraLines = extraLines.filter((e) => e.lines.length > 0);
  const labelBaseline = axisBaseline;
  axisBaseline += extraLines.reduce((m, e) => Math.max(m, e.lines.length), 0) * AXIS_NOTE_LINE;

  // Bottom, 2: the value labels, fitted to the column.
  let fit: FountainValueLabelFit | null = null;
  if (i.showValueLabels && resolved.jets.length > 0) {
    if (!labelsFlat) {
      warnings.push(
        overflow(
          "FountainChart: the x labels do not fit side by side, so the value labels under them are left out; widen the chart or show fewer jets.",
        ),
      );
    } else {
      const xs = scales;
      const colOf = (j: FountainResolvedJet): number => Math.round(xs.xOf(j) * 100) / 100;
      const perColumn = new Map<number, number>();
      for (const j of resolved.jets) perColumn.set(colOf(j), (perColumn.get(colOf(j)) ?? 0) + 1);
      const perJet = resolved.jets.map((j) =>
        (perColumn.get(colOf(j)) ?? 0) > 1
          ? []
          : fountainValueLabels(j, {
              format: i.format,
              words,
              referenceLines: i.referenceLines,
              showRange: i.showRange,
            }),
      );
      if ([...perColumn.values()].some((n) => n > 1)) {
        warnings.push(
          overflow(
            "FountainChart: jets that share a column get no value labels (they would print on top of each other).",
          ),
        );
      }
      fit = fitFountainValueLabels(perJet, xs.slotWidth, measure);
      if (fit.dropped !== "none") {
        const px = Math.round(xs.slotWidth);
        warnings.push(
          overflow(
            fit.dropped === "ends"
              ? `FountainChart: the columns are ${px} px wide, too narrow for the "${words.low}" and "${words.high}" value label lines, so they are left out; widen the chart or show fewer jets.`
              : `FountainChart: the columns are ${px} px wide, too narrow for any value label, so they are left out; widen the chart or show fewer jets.`,
          ),
        );
      }
    }
  }

  // Bottom, 3: the reading guide, wrapped between its rules; then the margin all of it
  // needs. The default names only the marks drawn: fountainJetMarks, the render model's
  // own rule, under the scales (the y-domain clip, showRange / showSamples, forecasts).
  const guideFor = (sc: FountainScales): string[] => {
    const marks = fountainGuideMarks(
      resolved.jets.map((j) => {
        const m = fountainJetMarks(j, sc, {
          showRange: i.showRange,
          showSamples: i.showSamples !== false,
        });
        return { bell: m?.bell ? m : null, dots: m?.samples ?? [] };
      }),
    );
    const text = fountainReadingGuide(i.readingGuide, marks);
    return text
      ? wrapFountainGuide(text, Math.max(40, i.width - 16), (s) =>
          measure(s, FOUNTAIN_LABEL_FONT, false),
        )
      : [];
  };
  let guideLines = guideFor(scales);
  const bottomFor = (f: FountainValueLabelFit | null): FountainBottomLayout =>
    fountainBottomLayout({
      axisLabelBaseline: axisBaseline,
      valueLines: f?.maxLines ?? 0,
      lineHeight: f?.lineHeight ?? FOUNTAIN_LABEL_LINE,
      guideLines: guideLines.length,
    });
  let bottom = bottomFor(fit);
  // Never let the words squeeze the plot below a readable height.
  const minPlot = Math.max(60, i.height * 0.3);
  if (fit && fit.maxLines > 0 && i.height - margin.top - bottom.bottom < minPlot) {
    fit = null;
    bottom = bottomFor(null);
    warnings.push(
      overflow(
        "FountainChart: the chart is too short for the value labels, so they are left out; make it taller or turn showValueLabels off.",
      ),
    );
  }
  const bottomBefore = margin.bottom;
  margin.bottom = Math.max(bottomBefore, bottom.bottom);
  scales = makeScales(margin);
  // The final plot is shorter than the one the guide was chosen on: a fountain only
  // just tall enough there may not be drawn now, so choose it again on these scales.
  const finalGuide = guideFor(scales);
  if (finalGuide.join("\n") !== guideLines.join("\n")) {
    guideLines = finalGuide;
    bottom = bottomFor(fit);
    margin.bottom = Math.max(bottomBefore, bottom.bottom);
    scales = makeScales(margin);
  }

  if (resolved.jets.length > 1 && scales.slotWidth < FOUNTAIN_MIN_SLOT) {
    warnings.push(
      overflow(
        `FountainChart: ${resolved.jets.length} jets leave each one ${Math.round(scales.slotWidth)} px, under the ${FOUNTAIN_MIN_SLOT} px a fountain needs; widen the chart, disable items, or aggregate.`,
      ),
    );
  }

  const final = scales;
  const axisNotes = extraLines.flatMap(({ at, lines }) => {
    const x =
      typeof at === "string"
        ? (final.xBand?.(at) ?? 0) + (final.xBand?.bandwidth() ?? 0) / 2
        : final.xOf({ label: "", x: at });
    return lines.map((text, k) => ({
      x,
      y: final.plot.bottom + labelBaseline + (k + 1) * AXIS_NOTE_LINE,
      text,
    }));
  });

  return {
    margin,
    scales: final,
    xAxis,
    valueFit: fit,
    bottom,
    guideLines,
    referenceWidth,
    yTitleX: i.yAxisTitle
      ? fountainYTitleLayout({ maxTickLabelWidth: tickLabelWidth, marginLeft: margin.left }).x
      : null,
    axisNotes,
    warnings,
  };
}
