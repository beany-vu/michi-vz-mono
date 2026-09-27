// FountainChart words (pure): the value labels printed under each x label, the
// default tooltip lines, the reference counts ("17 of 20 on time") and the reading
// guide. Plain words only (SPEC principle 5: no statistics jargon); every UI word is
// overridable through `labels`, `endLabels` and `sampleWord`, and every number goes
// through the chart's y formatter (yAxisFormat ?? the locale's number format).
import { defaultNumberFormatter, periodDateFormatter } from "../i18n/formatters";
import type { FountainResolvedJet } from "./data";
import type {
  FountainChartProps,
  FountainReferenceCount,
  FountainReferenceLine,
  XaxisDataType,
} from "../types";

/** Fewer samples than this add an "only N <sampleWord>" value label line. */
export const FOUNTAIN_FEW_SAMPLES = 10;

/** The separator between the rules of a reading guide (it wraps only there). */
export const FOUNTAIN_GUIDE_SEPARATOR = " · ";

/** The default reading guide's rules, each with the mark it explains. */
const DEFAULT_GUIDE_RULES: ReadonlyArray<{ text: string; mark?: "dots" | "range" }> = [
  { text: "Small dot = one measurement", mark: "dots" },
  { text: "Big dot = the usual one" },
  { text: "Dots close together = steady", mark: "dots" },
  { text: "Tall fountain = changes a lot", mark: "range" },
  { text: "Few dots = just a guess", mark: "dots" },
];

/** The default reading guide (`readingGuide: true`) when every mark is drawn. */
export const FOUNTAIN_DEFAULT_READING_GUIDE = DEFAULT_GUIDE_RULES.map((r) => r.text).join(
  FOUNTAIN_GUIDE_SEPARATOR,
);

/** Every UI word the chart prints, resolved with the English defaults. */
export interface FountainWords {
  /** Before the big dot's value (default "usual") */
  usual: string;
  /** "17 of 20" (default "of") */
  of: string;
  /** "only 5 days" (default "only") */
  only: string;
  /** "Fri (forecast)" (default "forecast") */
  forecast: string;
  /** Word for the low end (endLabels[0], default "lowest") */
  low: string;
  /** Word for the high end (endLabels[1], default "highest") */
  high: string;
  /** Plural noun for the samples (default "measurements") */
  sampleWord: string;
}

export function resolveFountainWords(
  p: Pick<FountainChartProps, "labels" | "endLabels" | "sampleWord">,
): FountainWords {
  return {
    usual: p.labels?.usual ?? "usual",
    of: p.labels?.of ?? "of",
    only: p.labels?.only ?? "only",
    forecast: p.labels?.forecast ?? "forecast",
    low: p.endLabels?.[0] ?? "lowest",
    high: p.endLabels?.[1] ?? "highest",
    sampleWord: p.sampleWord ?? "measurements",
  };
}

/** The chart's value formatter: yAxisFormat when given, else the locale's number format. */
export function fountainValueFormatter(
  yAxisFormat: FountainChartProps["yAxisFormat"],
  locale?: string,
): (n: number) => string {
  const f = yAxisFormat ?? defaultNumberFormatter(locale);
  return (n) => f(n);
}

/** Which of the marks a reading guide explains the chart actually draws. */
export interface FountainGuideMarks {
  /** Some jet draws small dots */
  dots: boolean;
  /** Some jet draws a fountain (a range) */
  range: boolean;
}

/**
 * The marks the chart actually draws, read off the drawn jets (the render model's, or
 * fountainJetMarks for a plan): a fountain where some jet has a bell, small dots where
 * some jet has dots. So the y-domain clip, showRange / showSamples, forecasts and
 * disabled items all count, the way the reader sees them.
 */
export function fountainGuideMarks(
  jets: ReadonlyArray<{ bell: object | null; dots: ArrayLike<unknown> }>,
): FountainGuideMarks {
  return {
    range: jets.some((j) => j.bell !== null),
    dots: jets.some((j) => j.dots.length > 0),
  };
}

/**
 * The reading guide to print, or null when it is off. A string is printed as given.
 * `true` prints the default rules for the marks the chart draws (`marks`, default all):
 * no small-dot rules without small dots, no "Tall fountain" rule without a fountain.
 */
export function fountainReadingGuide(
  readingGuide: boolean | string | undefined,
  marks: FountainGuideMarks = { dots: true, range: true },
): string | null {
  if (typeof readingGuide === "string") return readingGuide.trim() ? readingGuide : null;
  if (readingGuide !== true) return null;
  return DEFAULT_GUIDE_RULES.filter((r) => !r.mark || marks[r.mark])
    .map((r) => r.text)
    .join(FOUNTAIN_GUIDE_SEPARATOR);
}

/**
 * A trend jet's period as text (tooltip, summary, a11y table), or null in snapshot
 * mode. `xAxisFormat` wins and gets the same x the axis ticks get (epoch ms on date
 * axes); a number axis otherwise keeps the raw date (a year never becomes "2,001");
 * a date axis uses the locale's year / month format (periodDateFormatter, the axis's
 * own rule), so "2021" reads 2021 in every time zone.
 */
export function fountainPeriodLabel(
  jet: { date: number | string | null; x: number | null },
  temporalType: XaxisDataType | null,
  xAxisFormat?: (d: number | string) => string,
  locale?: string,
): string | null {
  if (!temporalType || jet.date === null) return null;
  const x = jet.x ?? jet.date;
  if (xAxisFormat) return xAxisFormat(x);
  if (temporalType === "number") return String(jet.date);
  return periodDateFormatter(temporalType, locale)(x);
}

/** An x label, with the forecast word for a predicted jet: "Fri (forecast)". */
export function fountainAxisLabel(label: string, forecast: boolean, words: FountainWords): string {
  return forecast ? `${label} (${words.forecast})` : label;
}

/** Words after a reference count when the line gives none. */
export function defaultCountLabel(goodSide: "below" | "above"): string {
  return goodSide === "below" ? "below the line" : "above the line";
}

/**
 * One count per reference line with a goodSide: how many of the jet's samples sit on
 * the good side, the line itself included ("below": sample <= value, "above": sample
 * >= value). [] for a jet without samples or a forecast (its dots are not drawn).
 */
export function fountainReferenceCounts(
  jet: Pick<FountainResolvedJet, "samples" | "forecast">,
  referenceLines: ReadonlyArray<FountainReferenceLine> | undefined,
): FountainReferenceCount[] {
  if (jet.forecast || jet.samples.length === 0) return [];
  const out: FountainReferenceCount[] = [];
  for (const line of referenceLines ?? []) {
    const v = Number(line.value);
    if (!line.goodSide || !Number.isFinite(v)) continue;
    const count =
      line.goodSide === "below"
        ? jet.samples.filter((s) => s <= v).length
        : jet.samples.filter((s) => s >= v).length;
    out.push({
      value: v,
      goodSide: line.goodSide,
      count,
      total: jet.samples.length,
      countLabel: line.countLabel ?? defaultCountLabel(line.goodSide),
    });
  }
  return out;
}

/** What a value label line stands for (renderers style count lines as attention). */
export type FountainValueLabelKind = "usual" | "low" | "high" | "only" | "count" | "countLabel";

/** One line of text under an x label. */
export interface FountainValueLabel {
  text: string;
  bold: boolean;
  kind: FountainValueLabelKind;
}

export interface FountainLabelOptions {
  /** Number formatter (fountainValueFormatter) */
  format: (n: number) => string;
  words: FountainWords;
  referenceLines?: ReadonlyArray<FountainReferenceLine>;
  /** false: the fountain is not drawn, so the end words are left out (default true) */
  showRange?: boolean;
}

/**
 * The value label lines under one x label, top to bottom: bold "usual 30"; "<low word>
 * 22" and "<high word> 55" when the jet has a range (and ranges show); "only N
 * <sampleWord>" when it has 1-9 samples (not for a forecast); then per reference line
 * with a goodSide a bold "17 of 20" and its count words. Layout (wrapping, dropping
 * the end lines on narrow columns) is the renderer's.
 */
export function fountainValueLabels(
  jet: Pick<FountainResolvedJet, "value" | "low" | "high" | "samples" | "forecast">,
  o: FountainLabelOptions,
): FountainValueLabel[] {
  const { format, words } = o;
  const lines: FountainValueLabel[] = [
    { text: `${words.usual} ${format(jet.value)}`, bold: true, kind: "usual" },
  ];
  if (o.showRange !== false && jet.low !== null && jet.high !== null) {
    lines.push({ text: `${words.low} ${format(jet.low)}`, bold: false, kind: "low" });
    lines.push({ text: `${words.high} ${format(jet.high)}`, bold: false, kind: "high" });
  }
  const n = jet.samples.length;
  if (!jet.forecast && n > 0 && n < FOUNTAIN_FEW_SAMPLES) {
    lines.push({ text: `${words.only} ${n} ${words.sampleWord}`, bold: false, kind: "only" });
  }
  for (const c of fountainReferenceCounts(jet, o.referenceLines)) {
    lines.push({ text: `${c.count} ${words.of} ${c.total}`, bold: true, kind: "count" });
    lines.push({ text: c.countLabel, bold: false, kind: "countLabel" });
  }
  return lines;
}

/** One tooltip line. */
export interface FountainTooltipLine {
  text: string;
  bold: boolean;
}

/**
 * The default tooltip, as plain-text lines: the label (" · <period>" in trend mode,
 * " (forecast)" for a predicted jet), "usual 30", "<low word> 22 · <high word> 55",
 * "20 <sampleWord>", and per reference line with a goodSide "17 of 20 <count words>".
 * The period is formatted by the caller.
 */
export function fountainTooltipLines(
  jet: Pick<FountainResolvedJet, "label" | "value" | "low" | "high" | "samples" | "forecast">,
  o: FountainLabelOptions & { period?: string | null },
): FountainTooltipLine[] {
  const { format, words } = o;
  const head = o.period ? `${jet.label} · ${o.period}` : jet.label;
  const lines: FountainTooltipLine[] = [
    { text: fountainAxisLabel(head, jet.forecast, words), bold: true },
    { text: `${words.usual} ${format(jet.value)}`, bold: false },
  ];
  if (o.showRange !== false && jet.low !== null && jet.high !== null) {
    lines.push({
      text: `${words.low} ${format(jet.low)} · ${words.high} ${format(jet.high)}`,
      bold: false,
    });
  }
  if (!jet.forecast && jet.samples.length > 0) {
    lines.push({ text: `${jet.samples.length} ${words.sampleWord}`, bold: false });
  }
  for (const c of fountainReferenceCounts(jet, o.referenceLines)) {
    lines.push({ text: `${c.count} ${words.of} ${c.total} ${c.countLabel}`, bold: false });
  }
  return lines;
}

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Tooltip lines as HTML: every line escaped, bold lines in <strong>, joined by <br/>. */
export function fountainTooltipHtml(lines: ReadonlyArray<FountainTooltipLine>): string {
  return lines
    .map((l) => (l.bold ? `<strong>${escapeHtml(l.text)}</strong>` : escapeHtml(l.text)))
    .join("<br/>");
}
