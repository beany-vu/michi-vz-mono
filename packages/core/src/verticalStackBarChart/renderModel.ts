// Renderer-agnostic VerticalStackBar model - consumed by SVG, canvas, hit-test,
// and context. Highlight opacity is computed at draw time (not baked in) so
// highlight changes don't rebuild geometry.
import { sanitizeForClassName } from "../math/sanitize";
import type { Margin, StackLegendItem, StackRectData } from "../types";
import type { PreparedStack } from "./stack";
import type { StackColorResolver } from "./colors";

/**
 * Baseline of the series-abbreviation row, px below the axis line. The x tick labels
 * start in that same row, so the engine reserves room above them whenever a DataSet
 * carries an abbreviation - otherwise a rotated "MM-YYYY" label runs straight through
 * the letters.
 */
export const ABBREV_LABEL_OFFSET = 15;

export interface StackAbbrevLabel {
  x: number;
  y: number;
  text: string;
}

export interface StackRenderModel {
  keys: string[];
  stackedRectData: Record<string, StackRectData[]>;
  abbrevLabels: StackAbbrevLabel[];
  legend: StackLegendItem[];
  dates: string[];
  visibleItems: string[];
  highlightSet: Set<string>;
}

export interface BuildStackModelOptions {
  height: number;
  margin: Margin;
  highlightItems: string[];
  /** Order for the legend rows + colour-slot assignment. Defaults to effectiveKeys;
   * the engine passes the reversed order for keysOrder="bottomToTop" so the colour
   * authority (which assigns by appearance order) matches the legacy chart. The
   * stack draw order (stackedData / keys) is unaffected. */
  legendOrder?: string[];
  /** Keys currently disabled by the consumer. They stay in the legend rows
   * (flagged disabled so the pill greys out instead of disappearing) even
   * though their bars are excluded from the stack. */
  disabledItems?: string[];
  /** Emit the series-abbreviation labels below the band x-axis (default true).
   * layout="horizontal" passes false - that axis row doesn't exist there. */
  abbrevLabels?: boolean;
}

export function buildStackRenderModel(
  prepared: PreparedStack,
  effectiveKeys: string[],
  dates: string[],
  colors: StackColorResolver,
  o: BuildStackModelOptions,
): StackRenderModel {
  const { stackedData } = prepared;

  const labelY = o.height - o.margin.bottom + ABBREV_LABEL_OFFSET;
  const abbrevLabels: StackAbbrevLabel[] = [];
  const seenAbbrev = new Set<string>();
  const visibleItems: string[] = [];

  const emitAbbrev = o.abbrevLabels !== false;
  for (const key of effectiveKeys) {
    const rects = stackedData[key] ?? [];
    if (rects.some((r) => !r.isMissing)) visibleItems.push(key);
    for (const r of rects) {
      // Abbrev labels only where the bar is wide enough to be legible.
      if (emitAbbrev && r.width >= 20 && r.seriesKeyAbbreviation) {
        const tag = `${r.seriesKey}|${r.date}|${Math.round(r.x)}`;
        if (!seenAbbrev.has(tag)) {
          seenAbbrev.add(tag);
          abbrevLabels.push({ x: r.x + r.width / 2, y: labelY, text: r.seriesKeyAbbreviation });
        }
      }
    }
  }

  const disabledSet = new Set(o.disabledItems ?? []);
  const legendKeys = o.legendOrder ?? effectiveKeys;
  const legend: StackLegendItem[] = legendKeys.map((key, i) => ({
    label: key,
    color: colors.getColor(key),
    order: i,
    disabled: disabledSet.has(key),
    dataLabelSafe: sanitizeForClassName(key),
  }));

  return {
    keys: effectiveKeys,
    stackedRectData: stackedData,
    abbrevLabels,
    legend,
    dates,
    visibleItems,
    highlightSet: new Set(o.highlightItems),
  };
}
