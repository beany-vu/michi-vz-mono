// Forgiving radar hit-testing. Renderer-NEUTRAL despite its history: it listens on
// the SVG element, which exists in every renderer (painted modes keep an svg layer
// for crisp text and the colour probe), and derives coordinates from
// svg.getBoundingClientRect(). Bound once per render by the engine for svg, canvas
// and webgpu alike, so all three resolve the same pole from the same pointer.
// Ported from legacy useRadarChartCanvasRendering.
import type { RadarRenderModel } from "./renderModel";

const POINT_RADIUS = 5;
const EDGE_HIT_TOLERANCE = 6;
const NEAREST_VERTEX_SNAP = 24;

interface HitPt {
  x: number;
  y: number;
  axisIndex: number;
}
interface SeriesHit {
  label: string;
  dimmed: boolean;
  points: HitPt[];
}
type Hit = { label: string; axisIndex: number };

const pointInPolygon = (mx: number, my: number, pts: HitPt[]): boolean => {
  if (pts.length < 3) return false;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x;
    const yi = pts[i].y;
    const xj = pts[j].x;
    const yj = pts[j].y;
    if (yi > my !== yj > my && mx < ((xj - xi) * (my - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const distToSeg = (mx: number, my: number, a: HitPt, b: HitPt): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(mx - a.x, my - a.y);
  const t = Math.max(0, Math.min(1, ((mx - a.x) * dx + (my - a.y) * dy) / len2));
  return Math.hypot(mx - (a.x + t * dx), my - (a.y + t * dy));
};

export const hitSubset = (
  subset: SeriesHit[],
  mx: number,
  my: number,
  forgiving: boolean,
): Hit | null => {
  // 1. pole-point (nearest drawn vertex within 7px)
  let best: Hit | null = null;
  let bestD = POINT_RADIUS + 2;
  for (const h of subset)
    for (const p of h.points) {
      const d = Math.hypot(p.x - mx, p.y - my);
      if (d <= bestD) {
        bestD = d;
        best = { label: h.label, axisIndex: p.axisIndex };
      }
    }
  if (best) return best;
  // 2. edge → snap to the nearer endpoint vertex
  let edgeBest: Hit | null = null;
  let edgeD = EDGE_HIT_TOLERANCE;
  for (const h of subset)
    for (let i = 0; i < h.points.length; i++) {
      const a = h.points[i];
      const b = h.points[(i + 1) % h.points.length];
      const d = distToSeg(mx, my, a, b);
      if (d <= edgeD) {
        edgeD = d;
        const closer = Math.hypot(a.x - mx, a.y - my) <= Math.hypot(b.x - mx, b.y - my) ? a : b;
        edgeBest = { label: h.label, axisIndex: closer.axisIndex };
      }
    }
  if (edgeBest) return edgeBest;
  // 3. interior
  for (const h of subset)
    if (pointInPolygon(mx, my, h.points)) {
      if (!forgiving) return { label: h.label, axisIndex: -1 };
      let nv: HitPt | null = null;
      let nd = Infinity;
      for (const p of h.points) {
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < nd) {
          nd = d;
          nv = p;
        }
      }
      return { label: h.label, axisIndex: nv ? nv.axisIndex : -1 };
    }
  // 4. snap pass (forgiving/active subset only): any vertex within 24px
  if (forgiving) {
    let snap: Hit | null = null;
    let snapD = NEAREST_VERTEX_SNAP;
    for (const h of subset)
      for (const p of h.points) {
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d <= snapD) {
          snapD = d;
          snap = { label: h.label, axisIndex: p.axisIndex };
        }
      }
    if (snap) return snap;
  }
  return null;
};

export interface RadarHoverCallbacks {
  onEnter: (label: string, axisIndex: number, ev: MouseEvent) => void;
  onLeave: () => void;
  onClick: (label: string, axisIndex: number, ev: MouseEvent) => void;
}

/**
 * Attach forgiving hover hit-testing to `svg` (which overlays the canvas and owns
 * pointer events). Active (non-dimmed) series are tested first with the forgiving
 * NEAREST_VERTEX_SNAP strategy; dimmed series tight (interior = highlight only, no
 * snap). Returns a teardown that removes the listeners.
 */
export function setupRadarHover(
  svg: SVGSVGElement,
  model: RadarRenderModel,
  cb: RadarHoverCallbacks,
): () => void {
  const hits: SeriesHit[] = model.series.map((s) => ({
    label: s.label,
    dimmed: s.dimmed,
    points: s.poles.map((p) => ({ x: p.x, y: p.y, axisIndex: p.axisIndex })),
  }));
  const pick = (mx: number, my: number): Hit | null => {
    // Only the active (non-dimmed) series is interactive - dimmed years are
    // de-emphasised background context, so they are not hit-tested (no hover/tooltip).
    const active = hits.filter((h) => !h.dimmed);
    return hitSubset(active, mx, my, true);
  };
  const at = (ev: MouseEvent): { mx: number; my: number } => {
    const rect = svg.getBoundingClientRect();
    return { mx: ev.clientX - rect.left, my: ev.clientY - rect.top };
  };
  const onMove = (ev: MouseEvent): void => {
    const { mx, my } = at(ev);
    const hit = pick(mx, my);
    if (hit) cb.onEnter(hit.label, hit.axisIndex, ev);
    else cb.onLeave();
  };
  const onLeave = (): void => cb.onLeave();
  const onClick = (ev: MouseEvent): void => {
    const { mx, my } = at(ev);
    const hit = pick(mx, my);
    if (hit && hit.axisIndex >= 0) cb.onClick(hit.label, hit.axisIndex, ev);
  };
  svg.addEventListener("mousemove", onMove);
  svg.addEventListener("mouseleave", onLeave);
  svg.addEventListener("click", onClick);
  return () => {
    svg.removeEventListener("mousemove", onMove);
    svg.removeEventListener("mouseleave", onLeave);
    svg.removeEventListener("click", onClick);
  };
}
