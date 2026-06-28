// Renderer-agnostic semantic context for Pie/donut. Derived from the processed
// slices (not the DOM), so SVG and canvas produce identical context.
import type { PieNode } from "../pieChart/data";
import type { PieArc } from "../pieChart/geometry";
import type { PieChartContext, PieSliceContext } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildPieContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  mode: "pie" | "donut";
  innerRadiusRatio: number;
  arcs: PieArc[];
  total: number;
  colorsMapping: Record<string, string>;
}

export function buildPieContext(input: BuildPieContextInput): PieChartContext {
  const { arcs, total, colorsMapping } = input;

  const slices: PieSliceContext[] = arcs.map((a) => {
    const node: PieNode = a.data;
    const share = total > 0 ? node.value / total : 0;
    return {
      label: node.label,
      code: node.code,
      color: colorsMapping[node.label] ?? "",
      value: round(node.value),
      share: round(share),
      startAngle: a.startAngle,
      endAngle: a.endAngle,
    };
  });

  let largestSlice: { label: string; value: number; share: number } | null = null;
  for (const s of slices) {
    if (!largestSlice || s.value > largestSlice.value) {
      largestSlice = { label: s.label, value: s.value, share: s.share };
    }
  }

  const kind = input.mode === "donut" ? "Donut" : "Pie";
  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `${kind} chart ${titlePart}with ${slices.length} slice${slices.length === 1 ? "" : "s"} totalling ${round(total)}.`;
  if (largestSlice) {
    summary += ` Largest: ${largestSlice.label} (${Math.round(largestSlice.share * 100)}%).`;
  }

  const headers = ["Label", "Value", "Share"];
  const rows = slices.map((s) => [s.label, s.value, `${Math.round(s.share * 100)}%`]);

  return {
    chartType: "pie-chart",
    title: input.title,
    renderer: input.renderer,
    mode: input.mode,
    innerRadiusRatio: input.innerRadiusRatio,
    slices,
    stats: {
      sliceCount: slices.length,
      total: round(total),
      largestSlice,
    },
    colorsMapping,
    summary,
    a11yTable: { headers, rows },
  };
}
