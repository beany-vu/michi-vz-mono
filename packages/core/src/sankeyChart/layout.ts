// Sankey layout — the only d3-sankey call site. d3-sankey MUTATES its input, so
// we clone first to keep the engine's stored props/hit-test data pure. Returns
// positioned node rects + per-link endpoint geometry (the renderer builds the
// rounded filled ribbon from it) in pixel space.
import { sankey, sankeyLeft } from "d3-sankey";
import type { SankeyNode, SankeyLink } from "d3-sankey";
import type { SkNode, SkLink } from "./data";

interface NodeExtra {
  id: string;
  label: string;
  color?: string;
}
type LinkExtra = Record<string, never>;
type SNode = SankeyNode<NodeExtra, LinkExtra>;
type SLink = SankeyLink<NodeExtra, LinkExtra>;

export interface SankeyLaidNode {
  id: string;
  label: string;
  color?: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  depth: number;
  /** Total flow through the node (max in/out). */
  value: number;
}

export interface SankeyLaidLink {
  sourceId: string;
  targetId: string;
  value: number;
  /** Band thickness in px (∝ value). */
  width: number;
  /** Source endpoint: x at the source node's right edge, centre y. */
  sx: number;
  sy: number;
  /** Target endpoint: x at the target node's left edge, centre y. */
  tx: number;
  ty: number;
}

export interface SankeyLayoutOptions {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  nodeWidth: number;
  nodePadding: number;
}

export function layoutSankey(
  graph: { nodes: SkNode[]; links: SkLink[] },
  o: SankeyLayoutOptions
): { nodes: SankeyLaidNode[]; links: SankeyLaidLink[] } {
  if (graph.nodes.length === 0 || o.x1 <= o.x0 || o.y1 <= o.y0) {
    return { nodes: [], links: [] };
  }

  const gen = sankey<NodeExtra, LinkExtra>()
    .nodeId((d) => d.id)
    .nodeAlign(sankeyLeft)
    .nodeWidth(o.nodeWidth)
    .nodePadding(o.nodePadding)
    .extent([
      [o.x0, o.y0],
      [o.x1, o.y1],
    ]);

  // Clone: d3-sankey replaces source/target with node refs and adds geometry.
  const cloned = {
    nodes: graph.nodes.map((n) => ({ ...n })) as SNode[],
    links: graph.links.map((l) => ({ ...l })) as unknown as SLink[],
  };
  const laid = gen(cloned);

  const nodes: SankeyLaidNode[] = laid.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    color: n.color,
    x0: n.x0 ?? 0,
    x1: n.x1 ?? 0,
    y0: n.y0 ?? 0,
    y1: n.y1 ?? 0,
    depth: n.depth ?? 0,
    value: n.value ?? 0,
  }));

  const links: SankeyLaidLink[] = laid.links.map((l) => ({
    sourceId: (l.source as SNode).id,
    targetId: (l.target as SNode).id,
    value: l.value,
    width: l.width ?? 1,
    sx: (l.source as SNode).x1 ?? 0,
    sy: l.y0 ?? 0,
    tx: (l.target as SNode).x0 ?? 0,
    ty: l.y1 ?? 0,
  }));

  return { nodes, links };
}
