// Two interchangeable layouts that both emit the SAME positioned-node shape, so
// the render model / SVG / canvas don't care which ran:
//   - layoutTreemap: squarified tiling via d3-hierarchy (desktop).
//   - layoutStack: a single-column vertical partition (full-width rows, height ∝
//     value), readable on narrow / mobile screens. The in-row realized/untapped
//     split is identical; only the box geometry differs.
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import type { TmNode } from "./data";

/** A positioned node in plot-local coordinates (margin applied later). */
export interface LaidOutNode {
  data: TmNode;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  depth: number;
  isLeaf: boolean;
}

export interface LayoutOptions {
  width: number;
  height: number;
  paddingInner: number;
  paddingTop: number;
}

export function layoutTreemap(root: TmNode, o: LayoutOptions): LaidOutNode[] {
  const h = hierarchy<TmNode>(root)
    .sum((d) => (d.children && d.children.length ? 0 : (d.tileValue ?? 0)))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const layout = treemap<TmNode>()
    .tile(treemapSquarify)
    .size([Math.max(0, o.width), Math.max(0, o.height)])
    .paddingInner(o.paddingInner)
    .paddingTop((node) => (node.depth === 0 ? 0 : o.paddingTop))
    .round(true);

  const positioned = layout(h);

  const out: LaidOutNode[] = [];
  for (const node of positioned.descendants()) {
    if (node.depth === 0) continue;
    out.push({
      data: node.data,
      x0: node.x0,
      y0: node.y0,
      x1: node.x1,
      y1: node.y1,
      depth: node.depth,
      isLeaf: !(node.children && node.children.length),
    });
  }
  return out;
}

interface StackLayoutOptions {
  width: number;
  height: number;
  paddingTop: number;
  paddingInner: number;
}

/** Single-column vertical partition. Top-level groups get a header band + a block
 * sized by their share; leaves split that block proportionally to tileValue. */
export function layoutStack(root: TmNode, o: StackLayoutOptions): LaidOutNode[] {
  const out: LaidOutNode[] = [];
  const W = Math.max(0, o.width);
  const H = Math.max(0, o.height);
  const tops = root.children ?? [];

  const leafTotal = (node: TmNode): number => {
    if (node.isLeaf) return node.tileValue ?? 0;
    return (node.children ?? []).reduce((a, c) => a + leafTotal(c), 0);
  };
  const grand = tops.reduce((a, t) => a + leafTotal(t), 0) || 1;
  const groupCount = tops.filter((t) => !t.isLeaf).length;
  const contentH = Math.max(0, H - groupCount * o.paddingTop);

  let y = 0;
  for (const top of tops) {
    const share = leafTotal(top) / grand;
    if (top.isLeaf) {
      const h = Math.round(share * H);
      out.push({ data: top, x0: 0, y0: y, x1: W, y1: y + h, depth: 1, isLeaf: true });
      y += h;
    } else {
      const blockContentH = Math.round(share * contentH);
      const blockH = o.paddingTop + blockContentH;
      out.push({ data: top, x0: 0, y0: y, x1: W, y1: y + blockH, depth: 1, isLeaf: false });
      const leaves = (top.children ?? []).filter((c) => c.isLeaf);
      const groupVal = leaves.reduce((a, l) => a + (l.tileValue ?? 0), 0) || 1;
      let iy = y + o.paddingTop;
      leaves.forEach((leaf, i) => {
        const last = i === leaves.length - 1;
        const h = last
          ? y + blockH - iy
          : Math.round(((leaf.tileValue ?? 0) / groupVal) * blockContentH);
        const pad = o.paddingInner;
        out.push({ data: leaf, x0: pad, y0: iy, x1: W - pad, y1: iy + h, depth: 2, isLeaf: true });
        iy += h;
      });
      y += blockH;
    }
  }
  return out;
}
