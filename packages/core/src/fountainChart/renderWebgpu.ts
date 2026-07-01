// EXPERIMENTAL opt-in WebGPU renderer for FountainChart — the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME FountainRenderModel. Colours
// are resolved through the SAME light-DOM probe canvas mode uses (makeSimpleProbe
// "path.mv-fountain-jet"/fill), so consumer CSS still reaches GPU pixels.
//
// The froth-slice/outline/mist silhouettes are closed polygons (produced by
// geometry.ts as SVG path strings: M..L..[A]..L..Z); this file samples each path
// into an ordered point ring (approximating the elliptical crown arc with short
// segments) and fans it from its centroid via marks.ts pushFan — the shared GPU
// layer only knows triangles/circles, not path strings. Droplet arcs (quadratic
// Beziers) and the trend polyline are sampled the same way and drawn with
// pushStroke. Device acquisition is async; while not ready this returns false and
// the engine paints the canvas-2D stopgap, then re-renders on onReady.
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { drawMarksWebgpu, emptyBatch, pushFan, pushStroke, markColor } from "../webgpu/marks";
import type { FountainRenderModel } from "./renderModel";

export interface FountainWebgpuOptions {
  width: number;
  height: number;
  /** resolved ink colour for the trend line (matches the SVG var(--michi-vz-ink,currentColor)) */
  inkColor: string;
  /** Called once when the GPU device becomes ready, so the engine re-renders. */
  onReady?: () => void;
}

/** Parse the M/L/A/Z (absolute) subset geometry.ts emits into an ordered point ring. */
function samplePath(d: string): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const cmds = d.match(/[A-Za-z][^A-Za-z]*/g) ?? [];
  let cur: [number, number] = [0, 0];
  for (const cmd of cmds) {
    const type = cmd[0];
    const nums = (cmd.slice(1).match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
    if (type === "M" || type === "L") {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        cur = [nums[i], nums[i + 1]];
        pts.push(cur);
      }
    } else if (type === "A") {
      // rx ry xRot largeArc sweep x y
      if (nums.length >= 7) {
        const [rx, ry, , , , x, y] = nums;
        const start = cur;
        const end: [number, number] = [x, y];
        const cx = (start[0] + end[0]) / 2;
        // Approximate the shallow crown arc with a short bulge sampled at a few
        // steps (matches the visual bulge geometry.ts draws; exact for our use).
        const steps = 8;
        const midY = Math.min(start[1], end[1]) - Math.min(ry, Math.max(rx, ry));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const px = start[0] + (end[0] - start[0]) * t;
          // quadratic bulge toward (cx, midY) for a smooth arc-like curve
          const bulge = 4 * t * (1 - t);
          const py = start[1] + (end[1] - start[1]) * t + (midY - (start[1] + end[1]) / 2) * bulge;
          cur = [px, py];
          pts.push(cur);
        }
        void cx;
      }
    } else if (type === "Z" || type === "z") {
      // closed — ring already implied; no point to add.
    }
  }
  return pts;
}

function centroidOf(ring: Array<[number, number]>): [number, number] {
  if (ring.length === 0) return [0, 0];
  let sx = 0;
  let sy = 0;
  for (const [x, y] of ring) {
    sx += x;
    sy += y;
  }
  return [sx / ring.length, sy / ring.length];
}

/** Sample a quadratic-bezier droplet path "M x,y Q cx,cy ex,ey" into a polyline. */
function sampleQuadratic(d: string): Array<[number, number]> {
  const nums = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
  if (nums.length < 6) return [];
  const [x0, y0, cx, cy, x1, y1] = nums;
  const steps = 12;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const px = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const py = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    pts.push([px, py]);
  }
  return pts;
}

export function drawFountainWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: FountainRenderModel,
  o: FountainWebgpuOptions
): boolean {
  // Resolve fill colours through the SAME probe canvas mode uses.
  const labels = [...new Set(model.jets.map((j) => j.label))];
  const fallback = new Map(model.jets.map((j) => [j.label, j.color]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("path", "mv-fountain-jet", "fill"),
    "fill"
  );
  const colorOf = (label: string, fb: string): string => fillColors.get(label) || fb;

  const batch = emptyBatch();

  if (model.trendLinePath) {
    const pts = samplePath(model.trendLinePath);
    if (pts.length >= 2) {
      pushStroke(batch.triangles, pts, 1.5, markColor(o.inkColor || "rgba(130,130,130,1)", 0.45));
    }
  }

  for (const jet of model.jets) {
    const color = colorOf(jet.label, jet.color);
    const dim = jet.dimmed ? 0.3 : 1;

    if (jet.mistPath) {
      const ring = samplePath(jet.mistPath);
      if (ring.length >= 3) {
        const [cx, cy] = centroidOf(ring);
        pushFan(batch.triangles, cx, cy, ring, markColor(color, dim * 0.1));
      }
    }

    jet.slicePaths.forEach((path, i) => {
      const ring = samplePath(path);
      if (ring.length < 3) return;
      const [cx, cy] = centroidOf(ring);
      pushFan(batch.triangles, cx, cy, ring, markColor(color, jet.sliceOpacities[i]));
    });

    // Predicted dashed outline is a stroke-only affordance that the flat MarkBatch
    // triangle layer can't express as a dash pattern; omitted in webgpu mode (the
    // solid froth-slice fill still conveys the jet — see fellBackFor).

    for (const dp of jet.dropletPaths) {
      const pts = sampleQuadratic(dp);
      if (pts.length >= 2) {
        pushStroke(batch.triangles, pts, 1.2, markColor(color, dim * 0.45));
      }
    }
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
