// SymbolMap force layout - the ONE-SHOT de-overlap simulation, the heart of this
// chart. Ported EXACTLY from legacy MapSymbolForce/Chart.js + ForceNode.js:
// forceX/forceY are given each node's TRUE projected position (via `.x(d => d.x)`
// / `.y(d => d.y)`, which d3-force snapshots as the pull TARGET the moment the
// force is attached - i.e. at `simulation.force(name, force)` time, before any
// tick has moved the node away from it) - so the simulation starts pinned to the
// real geography and only drifts from it to resolve collisions; it does NOT
// wander freely toward a shared centre the way BubbleChart's gravity cluster
// does. forceManyBody() (default strength -30, not exposed as a prop - the
// legacy chart never configured it either) adds mild separation on top of the
// dominant force, forceCollide (`radius + 2`, 3 iterations, keyed off the
// PRIMARY radius only - a legacy quirk preserved for parity even when
// `valueSecond`'s ring is larger). Settles to the legacy `alpha <= 0.0011`
// threshold on a `.stop()`ped simulation (same convention as bubbleChart/
// layout.ts) so no real-time timer ever starts under jsdom or in the browser:
// same inputs -> same number of ticks -> the same layout, every time.
//
// B3.6 boundary clamp: the classic d3 bounding pattern, applied every tick
// (not just post-simulation) so collide-driven drift can never leave a node
// outside the canvas even mid-settle. This is the SECOND line of defence
// against edge clipping - scales.ts's radius-aware fit inset is the first,
// handling the initial placement; this one handles drift the simulation
// introduces afterward. `bounds.radiusOf` is deliberately a SEPARATE callback
// from the collide `radiusOf` above: collide intentionally stays primary-
// radius-only for legacy parity, but the clamp should use the node's true
// EFFECTIVE (rendered) radius - max(primary, secondary) - since that's what
// visually overflows. Degenerate widths/heights (radius > half the canvas)
// are guarded by collapsing the clamp range to the centre rather than
// inverting it. Determinism is preserved: the clamp is a pure function of
// (tick output, width, height) with no randomness or timers.
import { forceSimulation, forceX, forceY, forceManyBody, forceCollide } from "d3-force";
import type { SimulationNodeDatum } from "d3-force";
import type { ProjectedPoint } from "./scales";

export interface SymbolMapLayoutPoint {
  point: ProjectedPoint;
  radius: number;
  x: number;
  y: number;
}

interface SimNode extends SimulationNodeDatum {
  point: ProjectedPoint;
  radius: number;
}

// Legacy's own settle condition: `while (force.alpha() > 0.0011) tick()`. d3-force's
// default alphaDecay (~0.0228) reaches this in ~292 ticks; the cap below just
// guarantees termination even if a future change alters that default.
const ALPHA_STOP = 0.0011;
const MAX_TICKS = 2000;

export interface SymbolMapLayoutBounds {
  width: number;
  height: number;
  /** Effective (rendered) radius for the clamp - pass `max(primaryRadius,
   * secondaryRadius)` per node; defaults to the collide `radiusOf` above when
   * omitted. */
  radiusOf?: (point: ProjectedPoint) => number;
}

/** Clamp `[lo, hi]` to a single point (`mid`) rather than inverting when
 * `hi < lo` (radius > half the extent) - a degenerate-canvas guard, not an
 * expected case in practice. */
function clamp(value: number, radius: number, extent: number): number {
  const mid = extent / 2;
  const lo = Math.min(radius, mid);
  const hi = Math.max(extent - radius, mid);
  return Math.min(Math.max(value, lo), hi);
}

export function layoutSymbolMap(
  points: ProjectedPoint[],
  radiusOf: (point: ProjectedPoint) => number,
  bounds?: SymbolMapLayoutBounds
): SymbolMapLayoutPoint[] {
  if (points.length === 0) return [];

  const nodes: SimNode[] = points.map((point) => ({
    point,
    radius: radiusOf(point),
    x: point.x,
    y: point.y,
  }));

  const simulation = forceSimulation(nodes)
    .force(
      "x",
      forceX<SimNode>((d) => d.x ?? d.point.x)
    )
    .force(
      "y",
      forceY<SimNode>((d) => d.y ?? d.point.y)
    )
    .force("charge", forceManyBody<SimNode>())
    .force(
      "collide",
      forceCollide<SimNode>()
        .radius((d) => d.radius + 2)
        .iterations(3)
    )
    .stop();

  const boundsRadiusOf = bounds?.radiusOf ?? radiusOf;

  let ticks = 0;
  while (simulation.alpha() > ALPHA_STOP && ticks < MAX_TICKS) {
    simulation.tick();
    if (bounds) {
      for (const n of nodes) {
        const r = boundsRadiusOf(n.point);
        n.x = clamp(n.x ?? n.point.x, r, bounds.width);
        n.y = clamp(n.y ?? n.point.y, r, bounds.height);
      }
    }
    ticks++;
  }

  return nodes.map((n) => ({
    point: n.point,
    radius: n.radius,
    x: n.x ?? n.point.x,
    y: n.y ?? n.point.y,
  }));
}
