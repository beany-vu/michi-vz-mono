// Treemap data layer: normalize the forest of TreemapNode into an internal tree,
// drop disabledItems subtrees, optionally keep the top-N leaves (filter) and floor
// tiny leaves (minTileShare), and tag every node with its colour group + path.
// Pure + DOM-free, so SVG and canvas share one source of truth.
import type { TreemapNode } from "../types";

export interface TmNode {
  label: string;
  code?: string;
  /** Real value: leaf's own value, or (for a parent) the sum of its leaves. */
  value: number;
  /** Leaf only: emphasized sub-portion in [0,value]; null = no split. */
  partial: number | null;
  color?: string;
  children?: TmNode[];
  /** Leaf only: value used for tiling area (after the minTileShare floor). */
  tileValue?: number;
  /** Top-level ancestor label = colour group. */
  groupLabel: string;
  /** Labels from the top-level group down to this node, inclusive. */
  path: string[];
  isLeaf: boolean;
}

export interface ProcessedTreemap {
  /** Synthetic root wrapping the forest (never rendered). */
  root: TmNode;
  /** Flat list of leaves after filtering, in encounter order. */
  leaves: TmNode[];
  /** Unique colour-group labels in encounter order. */
  groupKeys: string[];
  /** Explicit colours from each top-level node's `color` field, keyed by group label. */
  groupColors: Record<string, string>;
  /** True when any top-level node has children (multi-level). */
  nested: boolean;
  /** True when any leaf carries a finite `partial`. */
  hasPartial: boolean;
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function normalize(nodes: TreemapNode[], parentPath: string[], disabled: Set<string>): TmNode[] {
  const out: TmNode[] = [];
  for (const n of nodes) {
    if (disabled.has(n.label)) continue;
    const path = [...parentPath, n.label];
    const groupLabel = path[0];
    if (n.children && n.children.length) {
      const children = normalize(n.children, path, disabled);
      if (children.length === 0) continue; // fully disabled subtree
      const value = children.reduce((a, c) => a + c.value, 0);
      out.push({
        label: n.label,
        code: n.code,
        value,
        partial: null,
        color: n.color,
        children,
        groupLabel,
        path,
        isLeaf: false,
      });
    } else {
      const value = finite(n.value) ? n.value : 0;
      const partial = finite(n.partial) ? Math.max(0, Math.min(n.partial, value)) : null;
      out.push({
        label: n.label,
        code: n.code,
        value,
        partial,
        color: n.color,
        groupLabel,
        path,
        isLeaf: true,
      });
    }
  }
  return out;
}

function collectLeaves(node: TmNode, acc: TmNode[]): void {
  if (node.isLeaf) {
    acc.push(node);
    return;
  }
  for (const c of node.children ?? []) collectLeaves(c, acc);
}

/** Remove leaves not in `keep`, then prune now-empty parents. Returns survivors. */
function pruneToLeaves(nodes: TmNode[], keep: Set<TmNode>): TmNode[] {
  const out: TmNode[] = [];
  for (const n of nodes) {
    if (n.isLeaf) {
      if (keep.has(n)) out.push(n);
    } else {
      const children = pruneToLeaves(n.children ?? [], keep);
      if (children.length) {
        n.children = children;
        n.value = children.reduce((a, c) => a + c.value, 0);
        out.push(n);
      }
    }
  }
  return out;
}

export function processTreemapData(
  dataSet: TreemapNode[],
  opts: {
    disabledItems?: string[];
    filter?: { limit: number; sortingDir: "asc" | "desc" };
    minTileShare?: number;
  } = {},
): ProcessedTreemap {
  const disabled = new Set(opts.disabledItems ?? []);
  let roots = normalize(dataSet ?? [], [], disabled);

  // Top-N filter over all leaves.
  if (opts.filter && opts.filter.limit > 0) {
    const all: TmNode[] = [];
    roots.forEach((r) => collectLeaves(r, all));
    const dir = opts.filter.sortingDir === "asc" ? 1 : -1;
    const ranked = [...all].sort((a, b) => dir * (a.value - b.value));
    const keep = new Set(ranked.slice(0, opts.filter.limit));
    roots = pruneToLeaves(roots, keep);
  }

  const leaves: TmNode[] = [];
  roots.forEach((r) => collectLeaves(r, leaves));

  // Tiling values: optional floor so tiny leaves stay visible (min-tile trick).
  const maxVal = leaves.reduce((m, l) => Math.max(m, l.value), 0);
  for (const l of leaves) {
    if (maxVal <= 0) {
      l.tileValue = 1; // all-zero data: equal tiles instead of nothing
    } else if (opts.minTileShare && opts.minTileShare > 0) {
      l.tileValue = Math.max(l.value, (opts.minTileShare / 100) * maxVal);
    } else {
      l.tileValue = l.value;
    }
  }

  const groupKeys: string[] = [];
  for (const l of leaves) if (!groupKeys.includes(l.groupLabel)) groupKeys.push(l.groupLabel);

  // Explicit colours: a top-level node's `color` applies to its whole colour group
  // (the leaf's own colour in flat mode, the sector's colour in nested mode).
  const groupColors: Record<string, string> = {};
  for (const r of roots) if (r.color && !groupColors[r.label]) groupColors[r.label] = r.color;

  const root: TmNode = {
    label: "__root__",
    value: roots.reduce((a, r) => a + r.value, 0),
    partial: null,
    children: roots,
    groupLabel: "",
    path: [],
    isLeaf: false,
  };

  return {
    root,
    leaves,
    groupKeys,
    groupColors,
    nested: roots.some((r) => !!r.children && r.children.length > 0),
    hasPartial: leaves.some((l) => l.partial != null),
  };
}
