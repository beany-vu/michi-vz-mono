// Renderer-agnostic Sankey model - consumed by SVG, canvas, hit-test, and
// context. Node rects (with the colour-contract attributes) + link bands (path +
// width + stroke colour). Link colour follows the source or target node.
// Highlight dimming is applied at draw time (not baked here).
import { sanitizeForClassName } from "../math/sanitize";
import type { SankeyColorResolver } from "./colors";
import type { SankeyLaidNode, SankeyLaidLink } from "./layout";

// Closed filled-ribbon path for one link, with rounded corners of radius `r`
// where the band meets the source/target nodes. `r` is clamped to half the band
// thickness; r = 0 yields sharp corners. Cubic control points sit at the midpoint
// x, matching d3-sankey's horizontal link curve.
function ribbonPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  width: number,
  radius: number,
): string {
  const hw = width / 2;
  const r = Math.max(0, Math.min(radius, hw, Math.abs(tx - sx) / 2));
  const sTop = sy - hw;
  const sBot = sy + hw;
  const tTop = ty - hw;
  const tBot = ty + hw;
  const mx = (sx + tx) / 2;
  return (
    `M${sx},${sTop + r}` +
    `Q${sx},${sTop} ${sx + r},${sTop}` + // top-left corner
    `C${mx},${sTop} ${mx},${tTop} ${tx - r},${tTop}` + // top edge
    `Q${tx},${tTop} ${tx},${tTop + r}` + // top-right corner
    `L${tx},${tBot - r}` + // right edge
    `Q${tx},${tBot} ${tx - r},${tBot}` + // bottom-right corner
    `C${mx},${tBot} ${mx},${sBot} ${sx + r},${sBot}` + // bottom edge
    `Q${sx},${sBot} ${sx},${sBot - r}` + // bottom-left corner
    `Z` // left edge closes back to start
  );
}

export interface SankeyNodeMark {
  id: string;
  label: string;
  /** Colour-group key (the node id). */
  colorKey: string;
  dataLabelSafe: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  value: number;
  depth: number;
  /** True when the node sits in the left half (label goes to the right). */
  labelLeft: boolean;
}

export interface SankeyLinkMark {
  sourceId: string;
  targetId: string;
  /** Colour-group key (source or target node id, per linkColorMode). */
  colorKey: string;
  dataLabelSafe: string;
  d: string;
  width: number;
  color: string;
  value: number;
}

export interface SankeyRenderModel {
  nodes: SankeyNodeMark[];
  links: SankeyLinkMark[];
  nodeKeys: string[];
  /** Corner radius (px) for the node rects (clamped per-node at draw time). */
  nodeRadius: number;
  linkOpacity: number;
  showLabels: boolean;
  columnCount: number;
  highlightSet: Set<string>;
}

export interface BuildSankeyModelOptions {
  width: number;
  nodeKeys: string[];
  nodeRadius: number;
  /** Corner radius (px) of the filled flow ribbons at the node junctions. */
  linkRadius: number;
  linkColorMode: "source" | "target";
  linkOpacity: number;
  showLabels: boolean;
  highlightItems: string[];
}

export function buildSankeyRenderModel(
  laid: { nodes: SankeyLaidNode[]; links: SankeyLaidLink[] },
  colors: SankeyColorResolver,
  o: BuildSankeyModelOptions,
): SankeyRenderModel {
  const nodes: SankeyNodeMark[] = laid.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    colorKey: n.id,
    dataLabelSafe: sanitizeForClassName(n.id),
    x: n.x0,
    y: n.y0,
    w: Math.max(0, n.x1 - n.x0),
    h: Math.max(0, n.y1 - n.y0),
    fill: colors.getColor(n.id),
    value: n.value,
    depth: n.depth,
    labelLeft: (n.x0 + n.x1) / 2 < o.width / 2,
  }));

  const links: SankeyLinkMark[] = laid.links.map((l) => {
    const key = o.linkColorMode === "target" ? l.targetId : l.sourceId;
    return {
      sourceId: l.sourceId,
      targetId: l.targetId,
      colorKey: key,
      dataLabelSafe: sanitizeForClassName(key),
      d: ribbonPath(l.sx, l.sy, l.tx, l.ty, l.width, o.linkRadius),
      width: l.width,
      color: colors.getColor(key),
      value: l.value,
    };
  });

  const columnCount = nodes.reduce((m, n) => Math.max(m, n.depth), 0) + (nodes.length ? 1 : 0);

  return {
    nodes,
    links,
    nodeKeys: o.nodeKeys,
    nodeRadius: Math.max(0, o.nodeRadius),
    linkOpacity: o.linkOpacity,
    showLabels: o.showLabels,
    columnCount,
    highlightSet: new Set(o.highlightItems),
  };
}
