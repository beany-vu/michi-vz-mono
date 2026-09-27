// FountainChart text layout (pure): where the words go and how much room they need,
// so the engine can reserve margins before it builds the scales and every renderer
// (the text is always SVG, whatever paints the marks) draws the same thing.
// - value labels under each x label: wrapped to the column; on narrow columns the
//   font shrinks first, then the low/high lines go, then every value label goes,
//   so they never overlap a neighbour (SPEC section 4);
// - reference line labels at the right end of their line: wrapped, first line bold,
//   pushed down so two labels never overlap; the width they need is the right margin;
// - the reading guide under everything, after a thin rule;
// - the y-axis title, rotated, left of the tick labels.
// Widths come from an injected measure (fountainHostMeasure in the engine: canvas text
// metrics in the page's font, or 7 px per character without a canvas).
import type { FountainValueLabel } from "./labels";
import type { FountainRenderModel } from "./renderModel";

/** Value / reference label font size in px (the chart font size, 12, times 0.92). */
export const FOUNTAIN_LABEL_FONT = 11;
/** Line height of the label text in px. */
export const FOUNTAIN_LABEL_LINE = 13;
/** Space kept between the value labels of neighbouring columns (px). */
export const FOUNTAIN_LABEL_GAP = 6;
/** Font sizes tried, largest first, before value label lines are dropped. */
export const FOUNTAIN_LABEL_SIZES = [11, 10, 9] as const;
/** Widest a reference line label may wrap to (px). */
export const FOUNTAIN_REFERENCE_LABEL_WIDTH = 90;
/** Gap between the plot's right edge and a reference line label (px). */
export const FOUNTAIN_REFERENCE_LABEL_GAP = 6;

// Vertical rhythm under the plot (px).
const VALUE_GAP = 15; // x label baseline -> first value label baseline
const DESCENT = 4; // below the last baseline of a block
const RULE_GAP = 10; // text block -> the reading guide's rule
const GUIDE_GAP = 14; // rule -> first guide baseline
const BOTTOM_PAD = 6;

/** Width in px of `text` at `fontPx`, bold or not. */
export type FountainTextMeasure = (text: string, fontPx: number, bold: boolean) => number;

/**
 * A FountainTextMeasure from a measure at the chart's base font size (12 px by
 * default): scaled to the font size. Bold text uses `measureBold12` when given (the
 * page's bold face), else it is taken as about 7% wider.
 */
export function fountainTextMeasure(
  measure12: (text: string) => number,
  measureBold12?: (text: string) => number,
): FountainTextMeasure {
  return (text, fontPx, bold) =>
    (bold && measureBold12 ? measureBold12(text) : measure12(text) * (bold ? 1.07 : 1)) *
    (fontPx / 12);
}

/**
 * Greedy word wrap to `maxWidth`. A word wider than the width sits alone on its line
 * (the caller decides whether that is acceptable). Blank text has no lines.
 */
export function wrapFountainText(
  text: string,
  maxWidth: number,
  width: (s: string) => number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && width(next) > maxWidth) {
      out.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
}

/**
 * Wrap a reading guide to `maxWidth` between its rules (the " · " separators), never
 * inside one: rules join a line while it fits, and a line break drops the separator.
 * A rule wider than the line on its own wraps by words (the next rule may follow its
 * last piece). Blank text has no lines.
 */
export function wrapFountainGuide(
  text: string,
  maxWidth: number,
  width: (s: string) => number,
): string[] {
  const SEP = " · ";
  const rules = text
    .split(/\s+·\s+/)
    .map((r) => r.trim())
    .filter(Boolean);
  const out: string[] = [];
  let line = "";
  for (const rule of rules) {
    if (line && width(`${line}${SEP}${rule}`) <= maxWidth) {
      line = `${line}${SEP}${rule}`;
      continue;
    }
    if (line) out.push(line);
    if (width(rule) <= maxWidth) {
      line = rule;
      continue;
    }
    const pieces = wrapFountainText(rule, maxWidth, width);
    out.push(...pieces.slice(0, -1));
    line = pieces[pieces.length - 1] ?? "";
  }
  if (line) out.push(line);
  return out;
}

/**
 * An x label's lines when it does not fit its column on one line: the label with its
 * forecast note ("Fri (forecast)") when that fits `avail`; else the label's words
 * wrapped, with the note joined to the last line when it fits there, else on a line
 * of its own. `noteOwnLine` always puts the note on a line of its own (so forecast
 * labels read alike once one of them needs it). Null when a single word is wider than
 * `avail` or more than `maxLines` lines would be needed (the axis then tilts instead).
 */
export function wrapFountainAxisLabel(
  label: string,
  note: string | null,
  avail: number,
  width: (s: string) => number,
  maxLines = 3,
  noteOwnLine = false,
): string[] | null {
  const full = note ? `${label} ${note}` : label;
  const ownLine = noteOwnLine && !!note;
  if (!ownLine && width(full) <= avail) return [full];
  const lines = wrapFountainText(label, avail, width);
  if (note) {
    const last = lines.length > 0 ? `${lines[lines.length - 1]} ${note}` : note;
    if (!ownLine && lines.length > 0 && width(last) <= avail) lines[lines.length - 1] = last;
    else lines.push(note);
  }
  if (lines.length === 0 || lines.length > maxLines) return null;
  return lines.some((l) => width(l) > avail) ? null : lines;
}

/** The value labels laid out for every column. */
export interface FountainValueLabelFit {
  /** Font size in px the lines fit at */
  fontSize: number;
  lineHeight: number;
  /** What had to go: "ends" = the low/high lines, "all" = every value label */
  dropped: "none" | "ends" | "all";
  /** Per jet (input order): the wrapped lines, top to bottom */
  blocks: FountainValueLabel[][];
  /** Lines in the tallest block (the height to reserve) */
  maxLines: number;
}

const isEnd = (l: FountainValueLabel): boolean => l.kind === "low" || l.kind === "high";

/**
 * Fit every column's value labels into `columnWidth` minus a gap: one line each at the
 * normal size or one step smaller; else each line wrapped, at the largest size that
 * lets every piece fit; if none does, drop the low/high lines and try again; if even
 * that fails, drop every value label (dropped "all").
 */
export function fitFountainValueLabels(
  perJet: ReadonlyArray<ReadonlyArray<FountainValueLabel>>,
  columnWidth: number,
  measure: FountainTextMeasure,
): FountainValueLabelFit {
  const avail = columnWidth - FOUNTAIN_LABEL_GAP;
  const lineHeightOf = (fs: number): number => Math.round(fs * (FOUNTAIN_LABEL_LINE / 11));
  if (perJet.every((b) => b.length === 0)) {
    return {
      fontSize: FOUNTAIN_LABEL_FONT,
      lineHeight: FOUNTAIN_LABEL_LINE,
      dropped: "none",
      blocks: perJet.map(() => []),
      maxLines: 0,
    };
  }
  const every = perJet.map((b) => [...b]);
  const noEnds = perJet.map((b) => b.filter((l) => !isEnd(l)));
  // Preference: one line each at the normal or a slightly smaller size, then wrapped
  // lines (shrinking down to the smallest size), then without the end lines.
  const variants: Array<{
    dropped: "none" | "ends";
    wrap: boolean;
    sizes: ReadonlyArray<number>;
    blocks: FountainValueLabel[][];
  }> = [
    { dropped: "none", wrap: false, sizes: FOUNTAIN_LABEL_SIZES.slice(0, 2), blocks: every },
    { dropped: "none", wrap: true, sizes: FOUNTAIN_LABEL_SIZES, blocks: every },
    { dropped: "ends", wrap: true, sizes: FOUNTAIN_LABEL_SIZES, blocks: noEnds },
  ];
  for (const v of variants) {
    for (const fs of v.sizes) {
      const blocks: FountainValueLabel[][] = [];
      let fits = avail > 0;
      for (const block of v.blocks) {
        if (!fits) break;
        const out: FountainValueLabel[] = [];
        for (const l of block) {
          const pieces = v.wrap
            ? wrapFountainText(l.text, avail, (s) => measure(s, fs, l.bold))
            : [l.text];
          if (pieces.some((p) => measure(p, fs, l.bold) > avail + 1e-9)) {
            fits = false;
            break;
          }
          for (const p of pieces) out.push({ text: p, bold: l.bold, kind: l.kind });
        }
        blocks.push(out);
      }
      if (fits) {
        return {
          fontSize: fs,
          lineHeight: lineHeightOf(fs),
          dropped: v.dropped,
          blocks,
          maxLines: blocks.reduce((m, b) => Math.max(m, b.length), 0),
        };
      }
    }
  }
  return {
    fontSize: FOUNTAIN_LABEL_FONT,
    lineHeight: FOUNTAIN_LABEL_LINE,
    dropped: "all",
    blocks: perJet.map(() => []),
    maxLines: 0,
  };
}

/** One reference line label, wrapped. */
export interface FountainReferenceLabelText {
  /** Top to bottom; the first line is bold */
  lines: Array<{ text: string; bold: boolean }>;
  /** Widest line in px (the right margin it needs, before the gap) */
  width: number;
}

/** Wrap a reference line label to `maxWidth`; the first line is bold. */
export function wrapFountainReferenceLabel(
  label: string | undefined,
  maxWidth: number,
  measure: FountainTextMeasure,
): FountainReferenceLabelText {
  const fs = FOUNTAIN_LABEL_FONT;
  const words = (label ?? "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lines: [], width: 0 };
  // The first line is bold, so it is measured bold; the rest regular.
  const lines: Array<{ text: string; bold: boolean }> = [];
  let line = "";
  for (const w of words) {
    const bold = lines.length === 0;
    const next = line ? `${line} ${w}` : w;
    if (line && measure(next, fs, bold) > maxWidth) {
      lines.push({ text: line, bold });
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push({ text: line, bold: lines.length === 0 });
  const width = lines.reduce((m, l) => Math.max(m, measure(l.text, fs, l.bold)), 0);
  return { lines, width };
}

/**
 * First-line baselines for reference labels at their lines' y: centred on the line
 * (baseline 4 px below it), then, top to bottom, each pushed down so it starts below
 * the previous label's last line. Returned in input order.
 */
export function placeFountainReferenceLabels(
  items: ReadonlyArray<{ y: number; lineCount: number }>,
  lineHeight: number = FOUNTAIN_LABEL_LINE,
): number[] {
  const order = items.map((it, i) => ({ ...it, i })).sort((a, b) => a.y - b.y || a.i - b.i);
  const out = new Array<number>(items.length);
  let floor = -Infinity;
  for (const it of order) {
    const first = Math.max(it.y + 4, floor);
    out[it.i] = first;
    if (it.lineCount > 0) floor = first + it.lineCount * lineHeight;
  }
  return out;
}

/** Where the text under the plot goes, in px below the plot bottom. */
export interface FountainBottomLayout {
  /** First value label baseline */
  valueLabelTop: number;
  /** The thin rule above the reading guide, or null without a guide */
  ruleY: number | null;
  /** First reading guide baseline, or null without a guide */
  guideTop: number | null;
  /** The bottom margin all of it needs */
  bottom: number;
}

export function fountainBottomLayout(o: {
  /** Baseline of the x tick labels below the plot (band 20, linear 26) */
  axisLabelBaseline: number;
  valueLines: number;
  lineHeight: number;
  guideLines: number;
  guideLineHeight?: number;
}): FountainBottomLayout {
  const valueLabelTop = o.axisLabelBaseline + VALUE_GAP;
  const lastBaseline =
    o.valueLines > 0 ? valueLabelTop + (o.valueLines - 1) * o.lineHeight : o.axisLabelBaseline;
  if (o.guideLines <= 0) {
    return {
      valueLabelTop,
      ruleY: null,
      guideTop: null,
      bottom: lastBaseline + DESCENT + BOTTOM_PAD,
    };
  }
  const glh = o.guideLineHeight ?? o.lineHeight;
  const ruleY = lastBaseline + DESCENT + RULE_GAP;
  const guideTop = ruleY + GUIDE_GAP;
  return {
    valueLabelTop,
    ruleY,
    guideTop,
    bottom: guideTop + (o.guideLines - 1) * glh + DESCENT + BOTTOM_PAD,
  };
}

/**
 * The rotated y-axis title: its baseline x (the glyphs reach about 9 px left of it
 * and 3 px right), 8 px clear of the tick labels, and the left margin it needs.
 */
export function fountainYTitleLayout(o: { maxTickLabelWidth: number; marginLeft: number }): {
  x: number;
  requiredLeft: number;
} {
  const w = Math.ceil(o.maxTickLabelWidth);
  return { x: o.marginLeft - w - 19, requiredLeft: w + 30 };
}

/** Every word the chart prints around the marks, positioned in pixels (always SVG). */
export interface FountainTextModel {
  /** Value labels under the x labels, or null when there are none to print */
  valueLabels: {
    fontSize: number;
    lineHeight: number;
    /** y of the first line's baseline */
    top: number;
    /** One block per jet with lines (model order) */
    jets: Array<{
      label: string;
      safe: string;
      x: number;
      dimmed: boolean;
      lines: FountainValueLabel[];
    }>;
  } | null;
  /** One per drawn reference line with a label: at the right end, first line bold */
  referenceLabels: Array<{
    value: number;
    x: number;
    /** First line's baseline */
    y: number;
    lines: Array<{ text: string; bold: boolean }>;
  }>;
  /** The rotated y-axis title: baseline x, centre y */
  yTitle: { text: string; x: number; y: number } | null;
  /** Second lines under x labels (the forecast word when it does not fit beside them) */
  axisNotes: Array<{ x: number; y: number; text: string }>;
  /** The reading guide under everything, after a thin rule */
  readingGuide: {
    lines: string[];
    x: number;
    /** First line's baseline */
    top: number;
    ruleY: number;
    ruleX0: number;
    ruleX1: number;
  } | null;
  lineHeight: number;
}

export interface BuildFountainTextModelInput {
  /** From fitFountainValueLabels over the model's jets (null = no value labels) */
  valueFit: FountainValueLabelFit | null;
  /** From fountainBottomLayout for the final margins */
  bottom: FountainBottomLayout;
  measure: FountainTextMeasure;
  /** Width the reference labels wrap to (the reserved right margin minus the gap) */
  referenceWidth: number;
  /** The y-axis title and its baseline x (fountainYTitleLayout), or null */
  yTitle: { text: string; x: number } | null;
  /** The reading guide, already wrapped to the chart width ([] = none) */
  guideLines: string[];
  /** Chart width (the guide's rule spans it, 8 px in from each side) */
  width: number;
  /** Second lines under x labels, positioned (default none) */
  axisNotes?: Array<{ x: number; y: number; text: string }>;
}

/** Position every word around the marks from the render model and the layout. */
export function buildFountainTextModel(
  model: FountainRenderModel,
  i: BuildFountainTextModelInput,
): FountainTextModel {
  const { plot } = model;
  const fit = i.valueFit;
  const blocks = fit
    ? model.jets
        .map((j, k) => ({
          label: j.label,
          safe: j.safe,
          x: j.x,
          dimmed: j.dimmed,
          lines: fit.blocks[k] ?? [],
        }))
        .filter((b) => b.lines.length > 0)
    : [];
  const valueLabels =
    fit && blocks.length > 0
      ? {
          fontSize: fit.fontSize,
          lineHeight: fit.lineHeight,
          top: plot.bottom + i.bottom.valueLabelTop,
          jets: blocks,
        }
      : null;

  const wrapped = model.referenceLines.map((l) => ({
    line: l,
    text: wrapFountainReferenceLabel(l.label, i.referenceWidth, i.measure),
  }));
  const ys = placeFountainReferenceLabels(
    wrapped.map((w) => ({ y: w.line.y, lineCount: w.text.lines.length })),
  );
  const referenceLabels = wrapped
    .map((w, k) => ({
      value: w.line.value,
      x: w.line.x1 + FOUNTAIN_REFERENCE_LABEL_GAP,
      y: ys[k],
      lines: w.text.lines,
    }))
    .filter((r) => r.lines.length > 0);

  const guide =
    i.guideLines.length > 0 && i.bottom.guideTop !== null && i.bottom.ruleY !== null
      ? {
          lines: i.guideLines,
          x: 8,
          top: plot.bottom + i.bottom.guideTop,
          ruleY: plot.bottom + i.bottom.ruleY,
          ruleX0: 8,
          ruleX1: Math.max(8, i.width - 8),
        }
      : null;

  return {
    valueLabels,
    referenceLabels,
    yTitle: i.yTitle
      ? { text: i.yTitle.text, x: i.yTitle.x, y: (plot.top + plot.bottom) / 2 }
      : null,
    axisNotes: i.axisNotes ?? [],
    readingGuide: guide,
    lineHeight: FOUNTAIN_LABEL_LINE,
  };
}
