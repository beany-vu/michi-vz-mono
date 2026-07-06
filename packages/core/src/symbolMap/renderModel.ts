// Renderer-agnostic SymbolMap model: an OPTIONAL backdrop layer (one mark per
// geography feature, reusing ChoroplethMap's NormalizedGeoFeature + path
// generator - see geo/projections.ts) plus one mark per force-settled symbol
// (outer circle sized by `value`, optional concentric second circle sized by
// `valueSecond` - ported from legacy ForceNode.js's two-circle layering).
import { sanitizeForClassName } from "../math/sanitize";
import { createGeoPathGenerator } from "../geo/projections";
import type { NormalizedGeoFeature } from "../choroplethMap/data";
import type { SymbolMapColorResolver } from "./colors";
import type { SymbolMapLayoutPoint } from "./layout";
import type { GeoProjection, GeoPath } from "d3-geo";

export interface SymbolMapBackdropMark {
  id: string;
  geometry: GeoJSON.Geometry;
  /** Precomputed SVG path `d`; canvas/webgpu redraw the RAW `geometry` directly
   * through geoPath(projection, ctx) instead (d3-geo renders natively to a 2D
   * context - see ChoroplethMap's renderCanvas.ts for the same convention). */
  d: string | null;
}

export interface SymbolMapMark {
  id: string;
  label: string;
  lng: number;
  lat: number;
  /** Colour-group key (the symbol's label). */
  colorKey: string;
  dataLabelSafe: string;
  x: number;
  y: number;
  /** Outer (primary) circle radius, from `value`. */
  radius: number;
  /** Concentric second circle radius, from `valueSecond`; null when absent. */
  radiusSecond: number | null;
  fill: string;
  /** Outer circle opacity (legacy `opScale`, [0.4, 0.85]). */
  opacity: number;
  /** Second circle opacity = opacity - 0.3, clamped to >= 0 (legacy ForceNode's
   * `opacitySecond`; the raw formula can go negative, which SVG/canvas would
   * either reject or clamp inconsistently, so this pure layer clamps it once). */
  opacitySecond: number | null;
  value: number;
  valueSecond: number | null;
  dimmed: boolean;
}

export interface SymbolMapRenderModel {
  backdrop: SymbolMapBackdropMark[];
  symbols: SymbolMapMark[];
  projection: GeoProjection;
}

export interface BuildSymbolMapModelOptions {
  highlightItems: string[];
}

export function buildSymbolMapBackdrop(
  features: NormalizedGeoFeature[],
  projection: GeoProjection
): SymbolMapBackdropMark[] {
  const pathGen: GeoPath = createGeoPathGenerator(projection);
  return features.map((f) => {
    let d: string | null = null;
    if (f.geometry) {
      try {
        d = pathGen({ type: "Feature", properties: {}, geometry: f.geometry });
      } catch {
        d = null;
      }
    }
    return { id: f.id, geometry: f.geometry, d };
  });
}

export function buildSymbolMapRenderModel(
  laidOut: SymbolMapLayoutPoint[],
  colors: SymbolMapColorResolver,
  radiusOf: (value: number) => number,
  opacityOf: (value: number) => number,
  o: BuildSymbolMapModelOptions,
  projection: GeoProjection,
  backdrop: SymbolMapBackdropMark[] = []
): SymbolMapRenderModel {
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;

  const symbols: SymbolMapMark[] = laidOut.map((lp) => {
    const n = lp.point.node;
    const radiusSecond = n.valueSecond != null ? radiusOf(n.valueSecond) : null;
    const opacity = opacityOf(n.value);
    return {
      id: n.id,
      label: n.label,
      lng: n.lng,
      lat: n.lat,
      colorKey: n.label,
      dataLabelSafe: sanitizeForClassName(n.label),
      x: lp.x,
      y: lp.y,
      radius: lp.radius,
      radiusSecond,
      fill: colors.getColor(n.label),
      opacity,
      opacitySecond: radiusSecond != null ? Math.max(0, opacity - 0.3) : null,
      value: n.value,
      valueSecond: n.valueSecond,
      dimmed: anyHighlight && !highlightSet.has(n.label),
    };
  });

  return { backdrop, symbols, projection };
}
