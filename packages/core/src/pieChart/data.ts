// Pie data layer: normalize the dataSet into clamped slices, drop disabledItems,
// optionally keep the top-N (filter), and optionally sort by value for display.
// Pure + DOM-free, so SVG and canvas share one source of truth.
import type { PieDataItem } from "../types";

export interface PieNode {
  label: string;
  code?: string;
  /** Clamped slice value (>= 0). */
  value: number;
  color?: string;
}

export interface ProcessedPie {
  /** Slices in render order (after filter + optional value sort). */
  nodes: PieNode[];
  /** Unique slice labels in render order = colour groups. */
  groupKeys: string[];
  /** Explicit colours from each item's `color` field, keyed by label. */
  groupColors: Record<string, string>;
  /** Sum of all slice values. */
  total: number;
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function processPieData(
  dataSet: PieDataItem[],
  opts: {
    disabledItems?: string[];
    filter?: { limit: number; sortingDir: "asc" | "desc" };
    sortByValue?: boolean;
  } = {}
): ProcessedPie {
  const disabled = new Set(opts.disabledItems ?? []);
  let nodes: PieNode[] = (dataSet ?? [])
    .filter((d) => !disabled.has(d.label))
    .map((d) => ({
      label: d.label,
      code: d.code,
      value: finite(d.value) ? Math.max(0, d.value) : 0,
      color: d.color,
    }));

  // Top-N filter over slices (independent of the display sort below).
  if (opts.filter && opts.filter.limit > 0) {
    const dir = opts.filter.sortingDir === "asc" ? 1 : -1;
    nodes = [...nodes]
      .sort((a, b) => dir * (a.value - b.value))
      .slice(0, opts.filter.limit);
  }

  // Display order: value-descending by default, else preserve data order.
  if (opts.sortByValue !== false) {
    nodes = [...nodes].sort((a, b) => b.value - a.value);
  }

  const groupKeys: string[] = [];
  for (const n of nodes) if (!groupKeys.includes(n.label)) groupKeys.push(n.label);

  const groupColors: Record<string, string> = {};
  for (const n of nodes) if (n.color && !groupColors[n.label]) groupColors[n.label] = n.color;

  const total = nodes.reduce((a, n) => a + n.value, 0);

  return { nodes, groupKeys, groupColors, total };
}
