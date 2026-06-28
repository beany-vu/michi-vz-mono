// Opt-in Canvas 2D renderer for Sankey. Paints the same link bands + node rects
// the SVG renderer does (no DOM). Node fills resolve via the SVG colour probe
// (class `node`, fill) and link strokes via (class `link`, stroke), so consumer
// CSS reaches canvas pixels. jsdom has no 2D context → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { SankeyRenderModel } from "./renderModel";

export interface SankeyCanvasOptions {
  width: number;
  height: number;
}

// Rounded-rect fill via a manual arcTo path (jsdom's 2D context has no
// roundRect). Radius is clamped to half the shorter side; r <= 0 = plain rect.
function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const cr = Math.min(r, Math.min(w, h) / 2);
  if (cr <= 0) {
    ctx.fillRect(x, y, w, h);
    return;
  }
  const path = new Path2D();
  path.moveTo(x + cr, y);
  path.lineTo(x + w - cr, y);
  path.arcTo(x + w, y, x + w, y + cr, cr);
  path.lineTo(x + w, y + h - cr);
  path.arcTo(x + w, y + h, x + w - cr, y + h, cr);
  path.lineTo(x + cr, y + h);
  path.arcTo(x, y + h, x, y + h - cr, cr);
  path.lineTo(x, y + cr);
  path.arcTo(x, y, x + cr, y, cr);
  path.closePath();
  ctx.fill(path);
}

export function drawSankeyCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: SankeyRenderModel,
  o: SankeyCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const nodeFallback = new Map<string, string>();
  for (const n of model.nodes) if (!nodeFallback.has(n.colorKey)) nodeFallback.set(n.colorKey, n.fill);
  const nodeColors = resolveMarkColors(
    svg,
    model.nodeKeys,
    (k) => nodeFallback.get(k) || "transparent",
    makeSimpleProbe("rect", "node", "fill"),
    "fill"
  );
  // Links are filled ribbons → resolve their colour via `fill` (matches the SVG).
  const linkColors = resolveMarkColors(
    svg,
    model.nodeKeys,
    (k) => nodeFallback.get(k) || "transparent",
    makeSimpleProbe("path", "link", "fill"),
    "fill"
  );

  const anyHighlight = model.highlightSet.size > 0;

  // ---- Links (under the nodes) ----
  for (const l of model.links) {
    const lit =
      !anyHighlight || model.highlightSet.has(l.sourceId) || model.highlightSet.has(l.targetId);
    ctx.fillStyle = linkColors.get(l.colorKey) || l.color;
    ctx.globalAlpha = lit ? model.linkOpacity : model.linkOpacity * 0.25;
    ctx.fill(new Path2D(l.d));
  }
  ctx.globalAlpha = 1;

  // ---- Nodes ----
  const cs =
    svg && typeof window !== "undefined" && window.getComputedStyle
      ? window.getComputedStyle(svg)
      : null;
  const ink = (cs && cs.color) || "#2a1c15";
  const fam = (cs && cs.fontFamily) || "sans-serif";
  const fs = (cs && parseFloat(cs.getPropertyValue("--michi-vz-font-size"))) || 12;
  ctx.font = `${Math.round(fs)}px ${fam}`;
  ctx.textBaseline = "middle";

  for (const n of model.nodes) {
    const lit = !anyHighlight || model.highlightSet.has(n.id);
    ctx.globalAlpha = lit ? 1 : 0.25;
    ctx.fillStyle = nodeColors.get(n.colorKey) || n.fill;
    fillRoundedRect(ctx, n.x, n.y, n.w, n.h, model.nodeRadius);
    if (model.showLabels && n.h >= 6) {
      ctx.fillStyle = ink;
      ctx.textAlign = n.labelLeft ? "left" : "right";
      ctx.fillText(n.label, n.labelLeft ? n.x + n.w + 4 : n.x - 4, n.y + n.h / 2);
    }
  }
  ctx.globalAlpha = 1;
}
