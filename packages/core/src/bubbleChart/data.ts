// Bubble data layer: normalize the dataSet into clamped bubbles, drop
// disabledItems, optionally keep the top-N (filter), and clamp partial to
// [0,value]. Pure + DOM-free, so SVG and canvas share one source of truth.
import type { BubbleDataItem } from "../types";

export interface BubbleNode {
  label: string;
  code?: string;
  /** Clamped bubble value (>= 0). */
  value: number;
  /** Emphasized sub-portion in [0,value]; null = no split. */
  partial: number | null;
  color?: string;
}

export interface ProcessedBubble {
  nodes: BubbleNode[];
  /** Unique bubble labels in encounter order = colour groups. */
  groupKeys: string[];
  /** Explicit colours from each item's `color` field, keyed by label. */
  groupColors: Record<string, string>;
  /** Sum of all bubble values. */
  total: number;
  /** True when any bubble carries a finite `partial`. */
  hasPartial: boolean;
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function processBubbleData(
  dataSet: BubbleDataItem[],
  opts: {
    disabledItems?: string[];
    filter?: { limit: number; sortingDir: "asc" | "desc" };
  } = {}
): ProcessedBubble {
  const disabled = new Set(opts.disabledItems ?? []);
  let nodes: BubbleNode[] = (dataSet ?? [])
    .filter((d) => !disabled.has(d.label))
    .map((d) => {
      const value = finite(d.value) ? Math.max(0, d.value) : 0;
      const partial = finite(d.partial) ? Math.max(0, Math.min(d.partial, value)) : null;
      return { label: d.label, code: d.code, value, partial, color: d.color };
    });

  if (opts.filter && opts.filter.limit > 0) {
    const dir = opts.filter.sortingDir === "asc" ? 1 : -1;
    nodes = [...nodes]
      .sort((a, b) => dir * (a.value - b.value))
      .slice(0, opts.filter.limit);
  }

  const groupKeys: string[] = [];
  for (const n of nodes) if (!groupKeys.includes(n.label)) groupKeys.push(n.label);

  const groupColors: Record<string, string> = {};
  for (const n of nodes) if (n.color && !groupColors[n.label]) groupColors[n.label] = n.color;

  return {
    nodes,
    groupKeys,
    groupColors,
    total: nodes.reduce((a, n) => a + n.value, 0),
    hasPartial: nodes.some((n) => n.partial != null),
  };
}
