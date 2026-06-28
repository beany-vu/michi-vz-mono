// Renderer-agnostic Treemap model — consumed by SVG, canvas, hit-test, and
// context. One leaf mark per tile (with split geometry baked as `realizedWidth`),
// plus parent containers and a split legend. Highlight dimming is applied at draw
// time (not baked here) so highlight changes don't rebuild geometry.
import { sanitizeForClassName } from "../math/sanitize";
import type { Margin } from "../types";
import type { TreemapColorResolver } from "./colors";
import type { LaidOutNode } from "./layout";

export interface TreemapLeafMark {
  label: string;
  code?: string;
  /** Colour-group key (top-level ancestor, or own label when flat). */
  colorKey: string;
  /** sanitizeForClassName(colorKey) — the colour contract. */
  dataLabelSafe: string;
  /** sanitizeForClassName(label) — per-leaf hook for CSS/tests. */
  leafSafe: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  value: number;
  partial: number | null;
  remainder: number | null;
  partialPct: number | null;
  /** Width of the solid primary segment (w when there's no split). */
  realizedWidth: number;
  path: string[];
}

export interface TreemapContainerMark {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  dataLabelSafe: string;
  depth: number;
}

export interface TreemapLegendItem {
  label: string;
  /** Swatch opacity — primary = 1, remainder = splitOpacity. */
  opacity: number;
}

export interface TreemapRenderModel {
  containers: TreemapContainerMark[];
  leaves: TreemapLeafMark[];
  groupKeys: string[];
  splitLabels: [string, string];
  showSplit: boolean;
  splitOpacity: number;
  paddingTop: number;
  legend: TreemapLegendItem[];
  /** Representative tile colour for the legend swatches (first group's colour). */
  legendColor: string;
  highlightSet: Set<string>;
}

export interface BuildTreemapModelOptions {
  margin: Margin;
  groupKeys: string[];
  showSplit: boolean;
  splitOpacity: number;
  splitLabels: [string, string];
  paddingTop: number;
  highlightItems: string[];
}

export function buildTreemapRenderModel(
  laidOut: LaidOutNode[],
  colors: TreemapColorResolver,
  o: BuildTreemapModelOptions
): TreemapRenderModel {
  const ml = o.margin.left;
  const mt = o.margin.top;
  const containers: TreemapContainerMark[] = [];
  const leaves: TreemapLeafMark[] = [];

  for (const node of laidOut) {
    const x = node.x0 + ml;
    const y = node.y0 + mt;
    const w = Math.max(0, node.x1 - node.x0);
    const h = Math.max(0, node.y1 - node.y0);
    const d = node.data;

    if (!node.isLeaf) {
      containers.push({
        x,
        y,
        w,
        h,
        label: d.label,
        dataLabelSafe: sanitizeForClassName(d.groupLabel),
        depth: node.depth,
      });
      continue;
    }

    const value = d.value;
    const partial = d.partial;
    const partialPct = o.showSplit && partial != null && value > 0 ? partial / value : null;
    const remainder = partial != null ? Math.max(0, value - partial) : null;
    leaves.push({
      label: d.label,
      code: d.code,
      colorKey: d.groupLabel,
      dataLabelSafe: sanitizeForClassName(d.groupLabel),
      leafSafe: sanitizeForClassName(d.label),
      x,
      y,
      w,
      h,
      fill: colors.getColor(d.groupLabel),
      value,
      partial,
      remainder,
      partialPct,
      realizedWidth: partialPct != null ? w * partialPct : w,
      path: d.path,
    });
  }

  const legend: TreemapLegendItem[] = o.showSplit
    ? [
        { label: o.splitLabels[0], opacity: 1 },
        { label: o.splitLabels[1], opacity: o.splitOpacity },
      ]
    : [];

  return {
    containers,
    leaves,
    groupKeys: o.groupKeys,
    splitLabels: o.splitLabels,
    showSplit: o.showSplit,
    splitOpacity: o.splitOpacity,
    paddingTop: o.paddingTop,
    legend,
    legendColor: o.groupKeys.length ? colors.getColor(o.groupKeys[0]) : "#888888",
    highlightSet: new Set(o.highlightItems),
  };
}
