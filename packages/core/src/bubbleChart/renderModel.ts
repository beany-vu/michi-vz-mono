// Renderer-agnostic Bubble model — consumed by SVG, canvas, hit-test, and
// context. One mark per bubble (centre + radius, with the realized-core radius
// baked for the split), plus a split legend. Highlight dimming is applied at draw
// time (not baked here).
import { sanitizeForClassName } from "../math/sanitize";
import type { Margin } from "../types";
import type { BubbleColorResolver } from "./colors";
import type { PackedBubble } from "./layout";

export interface BubbleMark {
  label: string;
  code?: string;
  /** Colour-group key (the bubble label). */
  colorKey: string;
  /** sanitizeForClassName(label) — the colour contract. */
  dataLabelSafe: string;
  x: number;
  y: number;
  r: number;
  fill: string;
  value: number;
  partial: number | null;
  remainder: number | null;
  partialPct: number | null;
  /** Radius of the solid realized core (r when there's no split). */
  realizedRadius: number;
}

export interface BubbleLegendItem {
  label: string;
  /** Swatch opacity — primary = 1, remainder = splitOpacity. */
  opacity: number;
}

export interface BubbleRenderModel {
  bubbles: BubbleMark[];
  groupKeys: string[];
  splitLabels: [string, string];
  showSplit: boolean;
  splitOpacity: number;
  showLabels: boolean;
  legend: BubbleLegendItem[];
  /** Representative colour for the legend swatches (first group's colour). */
  legendColor: string;
  highlightSet: Set<string>;
}

export interface BuildBubbleModelOptions {
  margin: Margin;
  groupKeys: string[];
  showSplit: boolean;
  splitOpacity: number;
  splitLabels: [string, string];
  showLabels: boolean;
  highlightItems: string[];
}

export function buildBubbleRenderModel(
  packed: PackedBubble[],
  colors: BubbleColorResolver,
  o: BuildBubbleModelOptions
): BubbleRenderModel {
  const ml = o.margin.left;
  const mt = o.margin.top;

  const bubbles: BubbleMark[] = packed.map((p) => {
    const d = p.data;
    const partial = d.partial;
    const partialPct = o.showSplit && partial != null && d.value > 0 ? partial / d.value : null;
    const remainder = partial != null ? Math.max(0, d.value - partial) : null;
    return {
      label: d.label,
      code: d.code,
      colorKey: d.label,
      dataLabelSafe: sanitizeForClassName(d.label),
      x: p.x + ml,
      y: p.y + mt,
      r: p.r,
      fill: colors.getColor(d.label),
      value: d.value,
      partial,
      remainder,
      partialPct,
      // Area-true realized core: areaRealized/area = partialPct → rCore = r·√pct.
      realizedRadius: partialPct != null ? p.r * Math.sqrt(partialPct) : p.r,
    };
  });

  const legend: BubbleLegendItem[] = o.showSplit
    ? [
        { label: o.splitLabels[0], opacity: 1 },
        { label: o.splitLabels[1], opacity: o.splitOpacity },
      ]
    : [];

  return {
    bubbles,
    groupKeys: o.groupKeys,
    splitLabels: o.splitLabels,
    showSplit: o.showSplit,
    splitOpacity: o.splitOpacity,
    showLabels: o.showLabels,
    legend,
    legendColor: o.groupKeys.length ? colors.getColor(o.groupKeys[0]) : "#888888",
    highlightSet: new Set(o.highlightItems),
  };
}
