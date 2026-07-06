// Renderer-agnostic semantic context for RadialTree. Derived from the render
// model's marks (not the DOM), so SVG and canvas produce identical context.
import { buildLegendData } from "./legend";
import type { RadialTreeMark } from "../radialTree/renderModel";
import type { RadialTreeChartContext, RadialTreeNodeContext } from "../types";

export interface BuildRadialTreeContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  centerLabel?: string;
  marks: RadialTreeMark[];
  groupCount: number;
  leafCount: number;
  maxDepth: number;
  colorsMapping: Record<string, string>;
  disabledItems?: string[];
}

export function buildRadialTreeContext(input: BuildRadialTreeContextInput): RadialTreeChartContext {
  const nodes: RadialTreeNodeContext[] = input.marks.map((m) => ({
    label: m.label,
    code: m.code,
    color: m.fill,
    depth: m.depth,
    isLeaf: m.isLeaf,
    value: m.value,
    path: m.path,
  }));

  const grandTotal = input.marks.filter((m) => m.depth === 1).reduce((a, m) => a + m.value, 0);

  let max: { label: string; value: number } | null = null;
  let min: { label: string; value: number } | null = null;
  for (const m of input.marks) {
    if (!m.isLeaf) continue;
    if (!max || m.value > max.value) max = { label: m.label, value: m.value };
    if (!min || m.value < min.value) min = { label: m.label, value: m.value };
  }

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Radial tree ${titlePart}shows ${input.leafCount} leaf${input.leafCount === 1 ? "" : "ves"} across ${input.groupCount} group${input.groupCount === 1 ? "" : "s"}.`;
  if (max) summary += ` Largest: ${max.label} (${max.value}).`;
  if (min && max && min.label !== max.label) summary += ` Smallest: ${min.label} (${min.value}).`;
  if (input.maxDepth > 2) summary += ` Nesting goes ${input.maxDepth} levels deep.`;

  const legendData = buildLegendData({
    labels: input.marks.filter((m) => m.depth === 1).map((m) => m.label),
    colorsMapping: input.colorsMapping,
    disabledItems: input.disabledItems,
  });

  return {
    chartType: "radial-tree-chart",
    title: input.title,
    renderer: input.renderer,
    centerLabel: input.centerLabel,
    nodes,
    stats: {
      leafCount: input.leafCount,
      groupCount: input.groupCount,
      grandTotal,
      min,
      max,
      maxDepth: input.maxDepth,
    },
    colorsMapping: input.colorsMapping,
    legendData,
    summary,
    a11yTable: {
      headers: ["Label", "Depth", "Value"],
      rows: nodes.map((n) => [n.path.join(" › "), n.depth, n.value]),
    },
  };
}
