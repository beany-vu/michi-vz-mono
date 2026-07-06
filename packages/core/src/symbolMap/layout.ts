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

export function layoutSymbolMap(
  points: ProjectedPoint[],
  radiusOf: (point: ProjectedPoint) => number
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

  let ticks = 0;
  while (simulation.alpha() > ALPHA_STOP && ticks < MAX_TICKS) {
    simulation.tick();
    ticks++;
  }

  return nodes.map((n) => ({
    point: n.point,
    radius: n.radius,
    x: n.x ?? n.point.x,
    y: n.y ?? n.point.y,
  }));
}
