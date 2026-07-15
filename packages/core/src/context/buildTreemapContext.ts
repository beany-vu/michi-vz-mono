// Renderer-agnostic semantic context for Treemap. Derived from the processed data
// (the leaf list), not the DOM, so SVG and canvas produce identical context.
import { mixWithWhite } from "./legend";
import { sanitizeForClassName } from "../math/sanitize";
import type { TmNode } from "../treemapChart/data";
import type { LegendItem, TreemapChartContext, TreemapLeafContext } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildTreemapContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  layout: "squarify" | "stack";
  leaves: TmNode[];
  colorsMapping: Record<string, string>;
  splitLabels: [string, string];
  /** Remainder fill opacity; the veil strength is 1 - splitOpacity (renderer parity). */
  splitOpacity: number;
  /** Whether the pale/solid split is actually RENDERED (showSplit resolved). */
  showSplit: boolean;
  depth: number;
}

export function buildTreemapContext(input: BuildTreemapContextInput): TreemapChartContext {
  const { leaves, colorsMapping, splitLabels } = input;

  const leafCtx: TreemapLeafContext[] = leaves.map((l) => {
    const partial = l.partial;
    const remainder = partial != null ? round(Math.max(0, l.value - partial)) : null;
    const partialPct = partial != null && l.value > 0 ? round(partial / l.value) : null;
    return {
      label: l.label,
      code: l.code,
      color: colorsMapping[l.groupLabel] ?? "",
      path: l.path,
      value: round(l.value),
      partial: partial != null ? round(partial) : null,
      remainder,
      partialPct,
    };
  });

  const hasPartial = leaves.some((l) => l.partial != null);
  const grandTotal = round(leaves.reduce((a, l) => a + l.value, 0));
  const totalPartial = hasPartial ? round(leaves.reduce((a, l) => a + (l.partial ?? 0), 0)) : null;
  const totalRemainder =
    hasPartial && totalPartial != null ? round(grandTotal - totalPartial) : null;

  let largestLeaf: { label: string; value: number } | null = null;
  let largestRemainder: { label: string; remainder: number } | null = null;
  for (const l of leaves) {
    if (!largestLeaf || l.value > largestLeaf.value)
      largestLeaf = { label: l.label, value: round(l.value) };
    if (l.partial != null) {
      const rem = Math.max(0, l.value - l.partial);
      if (!largestRemainder || rem > largestRemainder.remainder) {
        largestRemainder = { label: l.label, remainder: round(rem) };
      }
    }
  }

  const titlePart = input.title ? `"${input.title}" ` : "";
  const groupCount = new Set(leaves.map((l) => l.groupLabel)).size;
  let summary = `Treemap ${titlePart}with ${leaves.length} tile${leaves.length === 1 ? "" : "s"}`;
  summary += input.depth > 1 ? ` across ${groupCount} group${groupCount === 1 ? "" : "s"}.` : ".";
  if (largestLeaf) summary += ` Largest: ${largestLeaf.label} (${largestLeaf.value}).`;
  if (totalPartial != null) {
    const pct = grandTotal > 0 ? Math.round((totalPartial / grandTotal) * 100) : 0;
    summary += ` ${splitLabels[0]} ${totalPartial} of ${grandTotal} (${pct}%); ${splitLabels[1]} ${totalRemainder}.`;
  }
  if (largestRemainder)
    summary += ` Biggest ${splitLabels[1].toLowerCase()}: ${largestRemainder.label} (${largestRemainder.remainder}).`;

  const headers = hasPartial
    ? ["Label", "Value", splitLabels[0], splitLabels[1], "%"]
    : ["Label", "Value"];
  const rows = leafCtx.map((l) => {
    const base: Array<string | number> = [l.path.join(" › "), l.value];
    if (hasPartial) {
      base.push(
        l.partial ?? "-",
        l.remainder ?? "-",
        l.partialPct != null ? `${Math.round(l.partialPct * 100)}%` : "-",
      );
    }
    return base;
  });

  // One legend row per colour-owning GROUP (top-level nodes own the palette).
  // With a split active, paleColor carries the veiled remainder tint (the same
  // white-mix the renderers paint), so paired pale/solid legends match pixels.
  const veil = Math.max(0, Math.min(0.95, 1 - input.splitOpacity));
  const seenGroups = new Set<string>();
  const legendData: LegendItem[] = [];
  for (const l of leaves) {
    if (!l.groupLabel || seenGroups.has(l.groupLabel)) continue;
    seenGroups.add(l.groupLabel);
    const color = colorsMapping[l.groupLabel] ?? "";
    legendData.push({
      label: l.groupLabel,
      color,
      order: legendData.length,
      dataLabelSafe: sanitizeForClassName(l.groupLabel),
      ...(hasPartial && input.showSplit ? { paleColor: mixWithWhite(color, veil) } : {}),
    });
  }

  return {
    chartType: "treemap-chart",
    title: input.title,
    renderer: input.renderer,
    layout: input.layout,
    splitLabels,
    leaves: leafCtx,
    legendData,
    depth: input.depth,
    stats: {
      leafCount: leaves.length,
      grandTotal,
      totalPartial,
      totalRemainder,
      largestLeaf,
      largestRemainder,
    },
    colorsMapping,
    summary,
    a11yTable: { headers, rows },
  };
}
