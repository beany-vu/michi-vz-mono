// SymbolMap marker pins: decorative glyphs drawn ABOVE the symbols at a lng/lat
// (a home location, an office, a port). They take no part in layout or
// hit-testing and have no tooltip - a consumer that needs interactivity draws
// its own overlay from the context's projected `x`/`y`. The built-in glyph is a
// 24x24 map pin (teardrop with a hole) whose TIP sits at the point; a custom
// `path` in its own `pathSize` box is scaled uniformly to `size` px tall and
// anchored the same way (bottom-centre of the box on the point).
import type { SymbolMapMarker } from "../types";

/** Built-in 24x24 map-pin glyph; the tip is at (12, 24). */
export const DEFAULT_MARKER_PATH =
  "M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9zm0 12.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z";
export const DEFAULT_MARKER_SIZE = 24;
export const DEFAULT_MARKER_COLOR = "#333";

export interface SymbolMapMarkerMark {
  id: string;
  label: string;
  lng: number;
  lat: number;
  /** Anchor point in plot px (the pin tip). */
  x: number;
  y: number;
  path: string;
  /** Uniform scale applied to `path` so the glyph is `size` px tall. */
  scale: number;
  /** Translation of the path box's origin so its bottom-centre lands on (x, y). */
  tx: number;
  ty: number;
  color: string;
  size: number;
}

export function buildSymbolMapMarkers(
  markers: SymbolMapMarker[] | undefined,
  project: (lng: number, lat: number) => [number, number] | null,
): SymbolMapMarkerMark[] {
  const out: SymbolMapMarkerMark[] = [];
  (markers ?? []).forEach((m, i) => {
    const p = project(m.lng, m.lat);
    if (!p) return;
    const [w, h] = m.pathSize ?? [DEFAULT_MARKER_SIZE, DEFAULT_MARKER_SIZE];
    const size = m.size ?? DEFAULT_MARKER_SIZE;
    const scale = h > 0 ? size / h : 1;
    out.push({
      id: m.id ?? `marker-${i}`,
      label: m.label ?? "",
      lng: m.lng,
      lat: m.lat,
      x: p[0],
      y: p[1],
      path: m.path ?? DEFAULT_MARKER_PATH,
      scale,
      tx: p[0] - (w * scale) / 2,
      ty: p[1] - h * scale,
      color: m.color ?? DEFAULT_MARKER_COLOR,
      size,
    });
  });
  return out;
}
