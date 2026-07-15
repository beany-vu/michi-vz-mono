// Bubble layout - the only d3-force call site. Radii are area-proportional to
// value, scaled so the bubbles fill a target fraction of the plot. A force
// simulation pulls every bubble toward the centre (gravity) and resolves
// overlaps (collision), so they "suck together" into an organic cluster.
//
// Strategy "force-recenter-scale": let the cluster settle freely (NO hard
// position clamp - clamping force-pushes edge bubbles through each other and
// breaks the no-overlap invariant), then UNIFORMLY scale positions + radii to
// fit the plot box and re-centre. Uniform scaling preserves non-overlap exactly:
// every centre distance and every radius (and the padding gap between them) is
// multiplied by the same factor s, so any gap that was >= 0 stays >= 0.
//
// The sim runs to a settled state SYNCHRONOUSLY (no animation) so SVG and canvas
// render identical positions; d3-force's default PRNG makes the result
// reproducible (deterministic, no Math.random).
import { forceSimulation, forceManyBody, forceX, forceY, forceCollide } from "d3-force";
import type { SimulationNodeDatum } from "d3-force";
import type { BubbleNode } from "./data";

export interface PackedBubble {
  data: BubbleNode;
  /** Plot-local centre. */
  x: number;
  y: number;
  r: number;
}

interface SimNode extends SimulationNodeDatum {
  data: BubbleNode;
  r: number;
}

const GOLDEN_ANGLE = 2.399963229728653;
const SETTLE_TICKS = 400;
const COLLIDE_ITERATIONS = 6;

export interface BubbleLayoutOptions {
  width: number;
  height: number;
  gravity: number;
  chargeStrength: number;
  padding: number;
  fillRatio: number;
  /** Simulation ticks to settle (default 400); fewer = faster, looser cluster. */
  settleTicks?: number;
}

// Shared sim construction: layoutBubbles (sync) and layoutBubblesAsync (chunked)
// build the IDENTICAL simulation, so both settle to the same deterministic layout.
function buildSim(nodes: BubbleNode[], o: BubbleLayoutOptions) {
  const cx = o.width / 2;
  const cy = o.height / 2;
  const totalValue = nodes.reduce((a, n) => a + n.value, 0);

  // Pick k so Σ(π·r²) = fillRatio·area, with r = k·√value (area ∝ value).
  const area = o.width * o.height;
  const k = totalValue > 0 ? Math.sqrt((o.fillRatio * area) / (Math.PI * totalValue)) : 0;
  const maxR = Math.min(o.width, o.height) / 2;
  const pad = Math.max(0, o.padding);

  const sim: SimNode[] = nodes.map((data, i) => {
    const r = Math.max(2, Math.min(maxR, k * Math.sqrt(data.value)));
    // Deterministic phyllotaxis seed around the centre (reproducible layout).
    const angle = i * GOLDEN_ANGLE;
    const rr = 6 * Math.sqrt(i);
    return {
      data,
      r,
      x: cx + rr * Math.cos(angle),
      y: cy + rr * Math.sin(angle),
    };
  });

  // Gravity sucks the cluster together; collision (dominant: full strength, many
  // iterations) guarantees the settled cluster is overlap-free with `pad` gaps.
  const simulation = forceSimulation(sim)
    .force("x", forceX<SimNode>(cx).strength(o.gravity))
    .force("y", forceY<SimNode>(cy).strength(o.gravity))
    .force(
      "collide",
      forceCollide<SimNode>()
        .radius((d) => d.r + pad / 2)
        .strength(1)
        .iterations(COLLIDE_ITERATIONS),
    )
    .stop();
  // A zero-strength many-body still pays the Barnes-Hut quadtree every tick;
  // only add the force when it actually does something.
  if (o.chargeStrength !== 0) {
    simulation.force("charge", forceManyBody<SimNode>().strength(o.chargeStrength));
  }
  return { sim, simulation, cx, cy };
}

export function layoutBubbles(nodes: BubbleNode[], o: BubbleLayoutOptions): PackedBubble[] {
  if (nodes.length === 0 || o.width <= 0 || o.height <= 0) return [];
  const { sim, simulation, cx, cy } = buildSim(nodes, o);
  simulation.tick(o.settleTicks ?? SETTLE_TICKS);
  return fitAndCentre(sim, o, cx, cy);
}

/**
 * Chunked variant of layoutBubbles for big clusters: runs the SAME deterministic
 * simulation, but in ~budgetMs slices yielded to the event loop (rAF when
 * available), so a multi-second settle never freezes the page. Resolves with the
 * identical layout the sync path produces, or null when cancelled.
 */
export function layoutBubblesAsync(
  nodes: BubbleNode[],
  o: BubbleLayoutOptions,
  opts: { budgetMs?: number } = {},
): { promise: Promise<PackedBubble[] | null>; cancel: () => void } {
  if (nodes.length === 0 || o.width <= 0 || o.height <= 0) {
    return { promise: Promise.resolve([]), cancel: () => {} };
  }
  const budget = Math.max(4, opts.budgetMs ?? 12);
  let cancelled = false;
  const { sim, simulation, cx, cy } = buildSim(nodes, o);
  let remaining = o.settleTicks ?? SETTLE_TICKS;

  const nextFrame = (): Promise<void> =>
    new Promise((resolve) => {
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
      else setTimeout(resolve, 0);
    });

  const promise = (async () => {
    while (remaining > 0) {
      if (cancelled) return null;
      const slice = Date.now() + budget;
      while (remaining > 0 && Date.now() < slice) {
        simulation.tick(1);
        remaining--;
      }
      if (remaining > 0) await nextFrame();
    }
    return cancelled ? null : fitAndCentre(sim, o, cx, cy);
  })();

  return { promise, cancel: () => (cancelled = true) };
}

function fitAndCentre(
  sim: SimNode[],
  o: BubbleLayoutOptions,
  cx: number,
  cy: number,
): PackedBubble[] {
  // Tight bounding box of the settled cluster, padded by each bubble's radius so
  // the box encloses the circle outlines, not just the centres.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of sim) {
    const x = n.x ?? cx;
    const y = n.y ?? cy;
    if (x - n.r < minX) minX = x - n.r;
    if (y - n.r < minY) minY = y - n.r;
    if (x + n.r > maxX) maxX = x + n.r;
    if (y + n.r > maxY) maxY = y + n.r;
  }
  const clusterW = maxX - minX;
  const clusterH = maxY - minY;

  // Uniform scale to fit the box (never upscale past 1 - keep the chosen fillRatio
  // when the cluster already fits). Uniform => non-overlap is preserved.
  const s = Math.min(
    clusterW > 0 ? o.width / clusterW : 1,
    clusterH > 0 ? o.height / clusterH : 1,
    1,
  );

  // Re-centre the scaled cluster in the plot box.
  const clusterCX = (minX + maxX) / 2;
  const clusterCY = (minY + maxY) / 2;

  return sim.map((n) => ({
    data: n.data,
    r: n.r * s,
    x: cx + ((n.x ?? cx) - clusterCX) * s,
    y: cy + ((n.y ?? cy) - clusterCY) * s,
  }));
}
