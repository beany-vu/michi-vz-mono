// Radial dendrogram layout via d3-hierarchy's `cluster()` - NOT `tree()`: cluster()
// places every LEAF at the same radial distance from the centre (a true
// dendrogram), which is the verified legacy TreeRadial behaviour; `tree()` would
// instead size each branch by its own subtree depth. Siblings are sorted by value
// descending (deterministic; the legacy chart's own sort had a quirky ascending
// side-effect on leaf order that this intentionally cleans up - see the engine's
// header comment). The polar->cartesian projection and the per-link cubic-bezier
// control points are ported verbatim from the legacy chart's `projection()` +
// inline path-string builder.
import { cluster, hierarchy } from "d3-hierarchy";
import type { RtNode } from "./data";

export interface RadialLink {
  /** Bezier start = this node's own projected position. */
  start: [number, number];
  c1: [number, number];
  c2: [number, number];
  /** Bezier end = the parent's projected position (the centre, for a depth-1 group). */
  end: [number, number];
}

export interface RadialLayoutNode {
  data: RtNode;
  /** Angle in degrees [0, 360) - d3-cluster's `x`. */
  angle: number;
  /** Radial distance from centre in px - d3-cluster's `y`. */
  radius: number;
  depth: number;
  isLeaf: boolean;
  /** Projected cartesian position, centre-relative (plot-local; margin applied later). */
  x: number;
  y: number;
  link: RadialLink;
}

export interface RadialLayoutOptions {
  /** Outer radius in px - the cluster's full radial extent (legacy `outerCircle`). */
  outerRadius: number;
}

/**
 * Polar -> cartesian, matching the legacy chart's exact formula: angle 0 points
 * straight up and angles increase clockwise (rotated -90° from the standard maths
 * convention), which is what makes a d3 radial cluster read top-down/clockwise.
 */
export function radialProjection(angleDeg: number, radius: number): [number, number] {
  const angle = ((angleDeg - 90) / 180) * Math.PI;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

export function layoutRadialTree(root: RtNode, o: RadialLayoutOptions): RadialLayoutNode[] {
  const h = hierarchy<RtNode>(root, (d) => d.children).sort((a, b) => (b.data.value ?? 0) - (a.data.value ?? 0));

  const layout = cluster<RtNode>().size([360, Math.max(0, o.outerRadius)]);
  const positioned = layout(h);

  const out: RadialLayoutNode[] = [];
  for (const node of positioned.descendants()) {
    if (node.depth === 0 || !node.parent) continue; // the synthetic root is never drawn
    const [x, y] = radialProjection(node.x, node.y);
    const parent = node.parent;
    // Depth-1 links (into the centre) curve more gently (a bigger divisor shrinks
    // the second control point's radius less) than deeper links - ported verbatim.
    const curveGrade = node.depth === 1 ? 7 : 2;
    const midRadius = (node.y + parent.y) / 2;
    const link: RadialLink = {
      start: [x, y],
      c1: radialProjection(node.x, midRadius),
      c2: radialProjection(parent.x, (node.y + parent.y) / curveGrade),
      end: radialProjection(parent.x, parent.y),
    };
    out.push({
      data: node.data,
      angle: node.x,
      radius: node.y,
      depth: node.depth,
      isLeaf: node.data.isLeaf,
      x,
      y,
      link,
    });
  }
  return out;
}
