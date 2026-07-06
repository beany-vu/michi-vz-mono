// RadialTree data layer: normalize the forest of RadialTreeNode into an internal
// tree, drop disabledItems subtrees, and tag every node with its colour group
// (the top-level ancestor's label) + path - the SAME shape TreemapChart's
// data.ts produces (RadialTreeNode deliberately mirrors TreemapNode). Pure +
// DOM-free, so SVG and canvas share one source of truth.
import type { RadialTreeNode } from "../types";

export interface RtNode {
  label: string;
  code?: string;
  /** Own value for a leaf; sum of children for a node with children. */
  value: number;
  color?: string;
  children?: RtNode[];
  /** Top-level ancestor label = colour group. */
  groupLabel: string;
  /** Labels from the top-level group down to this node, inclusive. */
  path: string[];
  isLeaf: boolean;
}

export interface ProcessedRadialTree {
  /** Synthetic root wrapping the forest (never rendered/circled). */
  root: RtNode;
  /** Every non-root node (groups at every depth AND leaves), in encounter order. */
  nodes: RtNode[];
  /** Leaf nodes only. */
  leaves: RtNode[];
  /** Top-level (depth 1) group nodes only. */
  groups: RtNode[];
  /** Unique colour-group labels in encounter order. */
  groupKeys: string[];
  /** Explicit colours from each top-level node's `color` field, keyed by group label. */
  groupColors: Record<string, string>;
  /** Maximum nesting depth (1 = every top-level node is a leaf). */
  maxDepth: number;
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function normalize(nodes: RadialTreeNode[], parentPath: string[], disabled: Set<string>): RtNode[] {
  const out: RtNode[] = [];
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
        color: n.color,
        children,
        groupLabel,
        path,
        isLeaf: false,
      });
    } else {
      const value = Math.max(0, finite(n.value) ? n.value : 0);
      out.push({ label: n.label, code: n.code, value, color: n.color, groupLabel, path, isLeaf: true });
    }
  }
  return out;
}

function collect(node: RtNode, depth: number, acc: { nodes: RtNode[]; leaves: RtNode[]; maxDepth: number }): void {
  acc.nodes.push(node);
  acc.maxDepth = Math.max(acc.maxDepth, depth);
  if (node.isLeaf || !node.children || node.children.length === 0) {
    acc.leaves.push(node);
    return;
  }
  for (const c of node.children) collect(c, depth + 1, acc);
}

export function processRadialTreeData(
  dataSet: RadialTreeNode[],
  opts: { disabledItems?: string[] } = {}
): ProcessedRadialTree {
  const disabled = new Set(opts.disabledItems ?? []);
  const groups = normalize(dataSet ?? [], [], disabled);

  const acc = { nodes: [] as RtNode[], leaves: [] as RtNode[], maxDepth: 0 };
  for (const g of groups) collect(g, 1, acc);

  const groupKeys: string[] = [];
  for (const n of acc.nodes) if (!groupKeys.includes(n.groupLabel)) groupKeys.push(n.groupLabel);

  // Explicit colours: a top-level node's `color` applies to its whole colour group.
  const groupColors: Record<string, string> = {};
  for (const g of groups) if (g.color && !groupColors[g.label]) groupColors[g.label] = g.color;

  const root: RtNode = {
    label: "__root__",
    value: groups.reduce((a, g) => a + g.value, 0),
    children: groups,
    groupLabel: "",
    path: [],
    isLeaf: false,
  };

  return {
    root,
    nodes: acc.nodes,
    leaves: acc.leaves,
    groups,
    groupKeys,
    groupColors,
    maxDepth: acc.maxDepth,
  };
}
