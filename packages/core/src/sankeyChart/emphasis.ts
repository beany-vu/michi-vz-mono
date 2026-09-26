// Sankey lit/dim logic - ONE pure source shared by the svg, canvas and webgpu
// renderers so they cannot diverge. Two inputs decide what stays lit:
//   • a transient hover emphasis (`hoverHighlight`): a NODE lights itself, every
//     link into or out of it and the nodes at those links' other ends; a LINK
//     lights only itself and its two end nodes;
//   • otherwise the consumer's `highlightItems` (links touching a highlighted
//     node, and the highlighted nodes themselves).
// While an emphasis exists it wins; without one the highlightItems state applies.
import type { SankeyRenderModel } from "./renderModel";

/** What the pointer is on: a node by id, or a link by its index in `model.links`
 *  (the ids let a stale index re-resolve after the model is rebuilt). */
export type SankeyEmphasisTarget =
  | { kind: "node"; id: string }
  | { kind: "link"; index: number; sourceId: string; targetId: string };

export interface SankeyEmphasis {
  /** Indices into `model.links` that stay lit. */
  links: ReadonlySet<number>;
  /** Node ids that stay lit. */
  nodes: ReadonlySet<string>;
}

/** Dim factor for unlit marks: links paint at linkOpacity x this, nodes at this. */
export const SANKEY_DIM = 0.25;

type EmphasisModel = Pick<SankeyRenderModel, "nodes" | "links">;

function resolveLinkIndex(
  model: EmphasisModel,
  t: Extract<SankeyEmphasisTarget, { kind: "link" }>,
): number {
  const at = model.links[t.index];
  if (at && at.sourceId === t.sourceId && at.targetId === t.targetId) return t.index;
  return model.links.findIndex((l) => l.sourceId === t.sourceId && l.targetId === t.targetId);
}

/**
 * The lit link indices and node ids for a hover target, or null when there is no
 * target or it no longer exists in the model (renderers then fall back to the
 * highlightItems state).
 */
export function sankeyEmphasis(
  model: EmphasisModel,
  target: SankeyEmphasisTarget | null,
): SankeyEmphasis | null {
  if (!target) return null;
  if (target.kind === "link") {
    const i = resolveLinkIndex(model, target);
    if (i < 0) return null;
    const l = model.links[i];
    return { links: new Set([i]), nodes: new Set([l.sourceId, l.targetId]) };
  }
  if (!model.nodes.some((n) => n.id === target.id)) return null;
  const links = new Set<number>();
  const nodes = new Set<string>([target.id]);
  model.links.forEach((l, i) => {
    if (l.sourceId === target.id) {
      links.add(i);
      nodes.add(l.targetId);
    } else if (l.targetId === target.id) {
      links.add(i);
      nodes.add(l.sourceId);
    }
  });
  return { links, nodes };
}

/** True when both targets point at the same mark (used to skip redundant repaints). */
export function sameSankeyTarget(
  a: SankeyEmphasisTarget | null,
  b: SankeyEmphasisTarget | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.kind === "node" || b.kind === "node") {
    return a.kind === "node" && b.kind === "node" && a.id === b.id;
  }
  return a.index === b.index && a.sourceId === b.sourceId && a.targetId === b.targetId;
}

export interface SankeyLitState {
  /** Parallel to `model.links`. */
  links: boolean[];
  /** Parallel to `model.nodes`. */
  nodes: boolean[];
}

/** Per-mark lit flags: the emphasis when there is one, else the highlightItems rule. */
export function sankeyLitState(
  model: SankeyRenderModel,
  emphasis: SankeyEmphasis | null,
): SankeyLitState {
  if (emphasis) {
    return {
      links: model.links.map((_, i) => emphasis.links.has(i)),
      nodes: model.nodes.map((n) => emphasis.nodes.has(n.id)),
    };
  }
  const hs = model.highlightSet;
  const any = hs.size > 0;
  return {
    links: model.links.map((l) => !any || hs.has(l.sourceId) || hs.has(l.targetId)),
    nodes: model.nodes.map((n) => !any || hs.has(n.id)),
  };
}

/** Link fill opacity for a lit/unlit link. */
export const sankeyLinkAlpha = (linkOpacity: number, lit: boolean): number =>
  lit ? linkOpacity : linkOpacity * SANKEY_DIM;

/** Node opacity for a lit/unlit node. */
export const sankeyNodeAlpha = (lit: boolean): number => (lit ? 1 : SANKEY_DIM);
