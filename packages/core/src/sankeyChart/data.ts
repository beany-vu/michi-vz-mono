// Sankey data layer: normalize nodes/links, drop disabledItems (nodes + any link
// touching them), drop links that reference an unknown node, and clamp link
// values. Pure + DOM-free, so SVG and canvas share one source of truth.
import type { SankeyNodeItem, SankeyLinkItem } from "../types";

export interface SkNode {
  id: string;
  label: string;
  color?: string;
}

export interface SkLink {
  source: string;
  target: string;
  value: number;
}

export interface ProcessedSankey {
  nodes: SkNode[];
  links: SkLink[];
  /** Node ids in encounter order = colour groups. */
  nodeKeys: string[];
  /** Explicit colours from each node's `color`, keyed by id. */
  nodeColors: Record<string, string>;
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function processSankeyData(
  nodesIn: SankeyNodeItem[],
  linksIn: SankeyLinkItem[],
  opts: { disabledItems?: string[] } = {}
): ProcessedSankey {
  const disabled = new Set(opts.disabledItems ?? []);
  const nodes: SkNode[] = (nodesIn ?? [])
    .filter((n) => !disabled.has(n.id))
    .map((n) => ({ id: n.id, label: n.label ?? n.id, color: n.color }));

  const known = new Set(nodes.map((n) => n.id));
  const links: SkLink[] = (linksIn ?? [])
    .filter(
      (l) =>
        !disabled.has(l.source) &&
        !disabled.has(l.target) &&
        known.has(l.source) &&
        known.has(l.target) &&
        l.source !== l.target
    )
    .map((l) => ({ source: l.source, target: l.target, value: finite(l.value) ? Math.max(0, l.value) : 0 }));

  const nodeKeys = nodes.map((n) => n.id);
  const nodeColors: Record<string, string> = {};
  for (const n of nodes) if (n.color && !nodeColors[n.id]) nodeColors[n.id] = n.color;

  return { nodes, links, nodeKeys, nodeColors };
}
