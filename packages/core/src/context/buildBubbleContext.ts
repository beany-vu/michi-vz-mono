// Renderer-agnostic semantic context for Bubble. Derived from the processed
// bubbles (not the DOM), so SVG and canvas produce identical context. The split
// stats mirror the Treemap so "realized vs untapped" reads the same everywhere.
import { mixWithWhite } from "./legend";
import { sanitizeForClassName } from "../math/sanitize";
import type { BubbleNode } from "../bubbleChart/data";
import type { BubbleChartContext, BubbleContext, LegendItem } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildBubbleContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  nodes: BubbleNode[];
  colorsMapping: Record<string, string>;
  splitLabels: [string, string];
  showSplit: boolean;
  /** Remainder fill opacity; the veil strength is 1 - splitOpacity (renderer parity). */
  splitOpacity: number;
}

export function buildBubbleContext(input: BuildBubbleContextInput): BubbleChartContext {
  const { nodes, colorsMapping, splitLabels, showSplit } = input;

  const bubbles: BubbleContext[] = nodes.map((n) => {
    const partial = showSplit ? n.partial : null;
    const remainder = partial != null ? round(Math.max(0, n.value - partial)) : null;
    const partialPct = partial != null && n.value > 0 ? round(partial / n.value) : null;
    return {
      label: n.label,
      code: n.code,
      color: colorsMapping[n.label] ?? "",
      value: round(n.value),
      partial: partial != null ? round(partial) : null,
      remainder,
      partialPct,
    };
  });

  const hasPartial = showSplit && nodes.some((n) => n.partial != null);
  const grandTotal = round(nodes.reduce((a, n) => a + n.value, 0));
  const totalPartial = hasPartial ? round(nodes.reduce((a, n) => a + (n.partial ?? 0), 0)) : null;
  const totalRemainder =
    hasPartial && totalPartial != null ? round(grandTotal - totalPartial) : null;

  let largestBubble: { label: string; value: number } | null = null;
  let largestRemainder: { label: string; remainder: number } | null = null;
  for (const n of nodes) {
    if (!largestBubble || n.value > largestBubble.value) {
      largestBubble = { label: n.label, value: round(n.value) };
    }
    if (hasPartial && n.partial != null) {
      const rem = Math.max(0, n.value - n.partial);
      if (!largestRemainder || rem > largestRemainder.remainder) {
        largestRemainder = { label: n.label, remainder: round(rem) };
      }
    }
  }

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Bubble chart ${titlePart}with ${nodes.length} bubble${nodes.length === 1 ? "" : "s"} totalling ${grandTotal}.`;
  if (largestBubble) summary += ` Largest: ${largestBubble.label} (${largestBubble.value}).`;
  if (totalPartial != null) {
    const pct = grandTotal > 0 ? Math.round((totalPartial / grandTotal) * 100) : 0;
    summary += ` ${splitLabels[0]} ${totalPartial} of ${grandTotal} (${pct}%); ${splitLabels[1]} ${totalRemainder}.`;
  }
  if (largestRemainder) {
    summary += ` Biggest ${splitLabels[1].toLowerCase()}: ${largestRemainder.label} (${largestRemainder.remainder}).`;
  }

  const headers = hasPartial
    ? ["Label", "Value", splitLabels[0], splitLabels[1], "%"]
    : ["Label", "Value"];
  const rows = bubbles.map((b) => {
    const base: Array<string | number> = [b.label, b.value];
    if (hasPartial) {
      base.push(
        b.partial ?? "-",
        b.remainder ?? "-",
        b.partialPct != null ? `${Math.round(b.partialPct * 100)}%` : "-",
      );
    }
    return base;
  });

  // One legend row per bubble label; with a split active, paleColor carries the
  // veiled remainder tint (same white-mix the renderers paint) so paired
  // pale/solid legends match pixels.
  const veil = Math.max(0, Math.min(0.95, 1 - input.splitOpacity));
  const legendData: LegendItem[] = bubbles.map((b, order) => ({
    label: b.label,
    color: b.color,
    order,
    dataLabelSafe: sanitizeForClassName(b.label),
    ...(hasPartial && b.partial != null ? { paleColor: mixWithWhite(b.color, veil) } : {}),
  }));

  return {
    chartType: "bubble-chart",
    title: input.title,
    renderer: input.renderer,
    splitLabels,
    bubbles,
    legendData,
    stats: {
      bubbleCount: nodes.length,
      total: grandTotal,
      totalPartial,
      totalRemainder,
      largestBubble,
      largestRemainder,
    },
    colorsMapping,
    summary,
    a11yTable: { headers, rows },
  };
}
