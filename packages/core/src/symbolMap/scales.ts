// SymbolMap projection + radius/opacity scales - two projection MODES:
//  - "dot-only" (no `geography`; the legacy chart's own look, and the default):
//    the chosen projection is used UNTUNED - a bare `factory()` with none of
//    ChoroplethMap's translate/scale/rotate/center tuning, exactly like legacy
//    MapSymbolForce/Chart.js's plain `geoMercator()` - and the projected point
//    extent is then RESCALED to fill [0,width]x[0,height], mirroring that
//    chart's own xScale/yScale-over-extent(...) math - INSET on both sides by
//    the largest effective radius in the set (B3.6), so the edge-of-extent
//    point (often also the largest, e.g. the max-`value` item) doesn't render
//    its circle half off-canvas. Any pair of identical coordinates collapses
//    to a single point pre-layout (by design - the force simulation's collide
//    force is what pulls them apart; see layout.ts, which also clamps drift
//    back inside the canvas as a second line of defence).
//  - "backdrop" (`geography` supplied): the SAME tuned dispatch ChoroplethMap
//    uses (geo/projections.ts's createTunedProjection), so the landmass and the
//    symbol coordinates share one consistent geographic framing - no extent
//    rescale, since the tuned projection already frames the whole viewport.
//
// Unlike the legacy chart (which read from a bundled, ~200-row static country
// coordinate table, so its extent was stable across renders regardless of which
// countries had data), this chart takes coordinates straight from `dataSet` - so
// in dot-only mode the extent is only as wide as the dataset's OWN coordinates.
// That is an intentional trade-off (see the chart's docs "Bring your own
// coordinates" section): the point of this migration is dropping the bundled
// coordinate CSV, not reproducing its incidental stability.
import { scaleLinear } from "d3-scale";
import { extent } from "d3-array";
import type { GeoProjection } from "d3-geo";
import { PROJECTIONS, createTunedProjection } from "../geo/projections";
import type { GeoProjectionName, GeoProjectionConfig } from "../geo/projections";
import type { SymbolMapNode } from "./data";

export const DEFAULT_PROJECTION: GeoProjectionName = "geoMercator";

export interface ProjectedPoint {
  node: SymbolMapNode;
  x: number;
  y: number;
}

export interface ProjectSymbolMapResult {
  points: ProjectedPoint[];
  projection: GeoProjection;
}

export function projectSymbolMapPoints(
  nodes: SymbolMapNode[],
  projectionName: GeoProjectionName | undefined,
  hasGeography: boolean,
  projectionConfig: GeoProjectionConfig | undefined,
  width: number,
  height: number,
  /** OPTIONAL, dot-only mode only: the EFFECTIVE (post-scale) radius a node
   * will render at - callers should pass `max(radiusOf(value), radiusOf(valueSecond))`
   * so a `valueSecond` ring larger than the primary circle is still accounted
   * for (see symbolMapChart.ts's `effectiveRadiusOf`). Used to inset the
   * rescale target range (B3.6 fix - see the block below); omitted (or a
   * dataset with radius 0 everywhere) reproduces the old center-only fit. */
  radiusOf?: (node: SymbolMapNode) => number
): ProjectSymbolMapResult {
  if (hasGeography) {
    const projection = createTunedProjection(projectionName, projectionConfig, width, height, {
      rotate: [-18, 0],
      center: [0, 10],
    });
    const points: ProjectedPoint[] = [];
    for (const node of nodes) {
      const p = projection([node.lng, node.lat]);
      if (p) points.push({ node, x: p[0], y: p[1] });
    }
    return { points, projection };
  }

  const factory = PROJECTIONS[projectionName ?? DEFAULT_PROJECTION] ?? PROJECTIONS.geoMercator;
  const projection = factory();

  const raw: Array<{ node: SymbolMapNode; x: number; y: number }> = [];
  for (const node of nodes) {
    const p = projection([node.lng, node.lat]);
    if (p) raw.push({ node, x: p[0], y: p[1] });
  }
  if (raw.length === 0) return { points: [], projection };

  const xExtent = extent(raw, (r) => r.x) as [number, number];
  const yExtent = extent(raw, (r) => r.y) as [number, number];
  const xFlat = xExtent[0] === xExtent[1];
  const yFlat = yExtent[0] === yExtent[1];

  // B3.6 radius-aware fit: the OLD fit rescaled point CENTERS to fill
  // [0,width]x[0,height] with no regard for how big a circle each point would
  // actually draw at - a point that lands at the raw extent's edge (e.g. the
  // dataset's max-value item, which also tends to get the largest radius)
  // then overflows the canvas by its own radius. Chosen fix: a single
  // max-radius inset applied to BOTH sides of the target range - simpler and
  // more predictable than solving the exact per-side required inset, and for a
  // small-radius dataset the inset is negligible so the spread isn't visibly
  // shrunk. Guarded so a huge radius on a tiny canvas can't invert the range;
  // it degrades to centering everything rather than producing NaN/backwards
  // extents.
  let maxRadius = 0;
  if (radiusOf) {
    for (const r of raw) {
      const rad = radiusOf(r.node);
      if (Number.isFinite(rad) && rad > maxRadius) maxRadius = rad;
    }
  }
  const xInset = Math.max(0, Math.min(maxRadius, width / 2));
  const yInset = Math.max(0, Math.min(maxRadius, height / 2));

  const xScale = xFlat ? null : scaleLinear().domain(xExtent).range([xInset, width - xInset]);
  const yScale = yFlat ? null : scaleLinear().domain(yExtent).range([yInset, height - yInset]);

  const points: ProjectedPoint[] = raw.map((r) => ({
    node: r.node,
    x: xFlat ? width / 2 : xScale!(r.x),
    y: yFlat ? height / 2 : yScale!(r.y),
  }));
  return { points, projection };
}

export interface SymbolMapRadiusScale {
  radiusOf: (value: number) => number;
  opacityOf: (value: number) => number;
}

/**
 * Builds the radius + opacity scales over ALL `located` items (both `value` and
 * `valueSecond`), independent of the `radiusVisibleMin` visibility filter - the
 * domain is computed from the FULL dataset before that filter runs, so a
 * symbol's radius stays comparable across renders even as `radiusVisibleMin`
 * hides small items (this much mirrors legacy Chart.js's `rExtent`/`opScale`).
 *
 * DELIBERATE DIVERGENCE from legacy: this uses the TRUE combined extent of
 * `value` and `valueSecond` (`min(all values)` .. `max(all values)`). Legacy
 * Chart.js instead computed `[min(primaryMin, secondaryMax), max(primaryMin,
 * secondaryMax)]` when a `radiusSecondValueKey` was present - a defective
 * formula that silently drops the primary max and the secondary min from the
 * domain entirely. Example: `value` extent [60,70], `valueSecond` extent
 * [20,30] -> legacy domain [30,60] (wrong: 70 and 20 never considered), this
 * chart's domain [20,70] (correct: spans every value actually drawn). We do
 * NOT port that bug - see `symbolMapPureLayer.test.ts`'s
 * "matches the reviewer's numeric case" test, which pins this chart's chosen
 * (correct) behaviour against the legacy formula's result for the same input.
 */
export function buildSymbolMapRadiusScale(
  located: SymbolMapNode[],
  radiusRange: [number, number],
  radiusVisibleMin: number | undefined
): SymbolMapRadiusScale {
  const values: number[] = [];
  for (const n of located) {
    values.push(n.value);
    if (n.valueSecond != null) values.push(n.valueSecond);
  }
  const [rawLo, rawHi] = (extent(values) as [number | undefined, number | undefined]) ?? [undefined, undefined];
  let lo = rawLo ?? 0;
  const hi = rawHi ?? 0;
  // Legacy quirk (Chart.js's own "set min value to 10" comment): when the domain
  // max exceeds 100 and the domain min is below radiusVisibleMin, the domain
  // floor is raised to radiusVisibleMin - keeps a handful of near-zero values
  // from making every other circle look identically huge on a linear scale.
  if (radiusVisibleMin !== undefined && hi > 100 && lo < radiusVisibleMin) {
    lo = radiusVisibleMin;
  }
  const rScale = scaleLinear().domain([lo, hi]).range(radiusRange);
  // Legacy `opScale` range: [0.4, 0.85].
  const opacityScale = scaleLinear().domain([lo, hi]).range([0.4, 0.85]);
  return { radiusOf: (v) => rScale(v), opacityOf: (v) => opacityScale(v) };
}
