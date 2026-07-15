// Point-in-geometry hit test for ChoroplethMap host-level hover in canvas/webgpu
// mode (painted marks have no DOM to attach per-region mouse listeners to - see
// engine/choroplethMapChart.ts's onHostMove). Re-projects the RAW GeoJSON
// coordinates through the SAME projection used to draw (not the precomputed SVG
// `d` string), then runs a standard even-odd ray-casting test across every ring.
// Even-odd correctly handles holes (e.g. an enclave) regardless of ring winding
// order, with no dependency on Canvas 2D's isPointInPath - which is unavailable
// under jsdom (the optional `canvas` npm package isn't installed here; see
// canvas/setupCanvas.ts's comment) - so this is pure JS, identical under test and
// in the browser.
import type { GeoProjection } from "d3-geo";

function projectRing(projection: GeoProjection, ring: GeoJSON.Position[]): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const pos of ring) {
    const p = projection([pos[0], pos[1]]);
    if (p) out.push([p[0], p[1]]);
  }
  return out;
}

function pointInRings(rings: Array<Array<[number, number]>>, x: number, y: number): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
  }
  return inside;
}

export function pointInGeometry(
  projection: GeoProjection,
  geometry: GeoJSON.Geometry | null | undefined,
  x: number,
  y: number,
): boolean {
  if (!geometry) return false;
  switch (geometry.type) {
    case "Polygon":
      return pointInRings(
        geometry.coordinates.map((ring) => projectRing(projection, ring)),
        x,
        y,
      );
    case "MultiPolygon":
      return geometry.coordinates.some((poly) =>
        pointInRings(
          poly.map((ring) => projectRing(projection, ring)),
          x,
          y,
        ),
      );
    case "GeometryCollection":
      return geometry.geometries.some((g) => pointInGeometry(projection, g, x, y));
    default:
      return false;
  }
}
