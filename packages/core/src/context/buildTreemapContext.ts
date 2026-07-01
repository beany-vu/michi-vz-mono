// Renderer-agnostic semantic context for Treemap. Derived from the processed data
// (the leaf list), not the DOM, so SVG and canvas produce identical context.
import type { TmNode } from "../treemapChart/data";
import type { TreemapChartContext, TreemapLeafContext } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildTreemapContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  layout: "squarify" | "stack";
  leaves: TmNode[];
  colorsMapping: Record<string, string>;
  splitLabels: [string, string];
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
  const totalPartial = hasPartial
    ? round(leaves.reduce((a, l) => a + (l.partial ?? 0), 0))
    : null;
  const totalRemainder =
    hasPartial && totalPartial != null ? round(grandTotal - totalPartial) : null;

  let largestLeaf: { label: string; value: number } | null = null;
  let largestRemainder: { label: string; remainder: number } | null = null;
  for (const l of leaves) {
    if (!largestLeaf || l.value > largestLeaf.value) largestLeaf = { label: l.label, value: round(l.value) };
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
  if (largestRemainder) summary += ` Biggest ${splitLabels[1].toLowerCase()}: ${largestRemainder.label} (${largestRemainder.remainder}).`;

  const headers = hasPartial
    ? ["Label", "Value", splitLabels[0], splitLabels[1], "%"]
    : ["Label", "Value"];
  const rows = leafCtx.map((l) => {
    const base: Array<string | number> = [l.path.join(" › "), l.value];
    if (hasPartial) {
      base.push(
        l.partial ?? "-",
        l.remainder ?? "-",
        l.partialPct != null ? `${Math.round(l.partialPct * 100)}%` : "-"
      );
    }
    return base;
  });

  return {
    chartType: "treemap-chart",
    title: input.title,
    renderer: input.renderer,
    layout: input.layout,
    splitLabels,
    leaves: leafCtx,
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
