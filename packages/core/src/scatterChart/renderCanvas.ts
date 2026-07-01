// Opt-in Canvas 2D renderer for ScatterPlot. Draws each point's mark; fill colour
// resolved via the SVG colour probe (resolveMarkColors `scatter-point`/fill) so
// consumer CSS reaches canvas pixels. jsdom → setupCanvas null → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors } from "../canvas/resolveMarkColors";
import type { ColorProbe } from "../canvas/resolveMarkColors";
import type { ScatterPointModel, ScatterRenderModel } from "./renderModel";

// The MonitorV2 consumer colours scatter marks via CSS keyed `g[data-label-safe] > *`
// (the legacy <g>-wrapped structure). The canvas colour probe must therefore be a
// `<g data-label-safe>` wrapping the mark, so getComputedStyle on the inner element
// picks up that fill. A FLAT probe (bare <circle>) would NOT match the descendant
// selector → every label resolves to the transparent skip-mode fallback → an
// invisible chart. Mirrors makeSubBarProbe's nested-probe pattern.
export const makeGroupedScatterProbe = (
  label: string,
  labelSafe: string,
  fallback: string
): ColorProbe => {
  const NS = "http://www.w3.org/2000/svg";
  const g = document.createElementNS(NS, "g") as SVGGElement;
  g.setAttribute("data-label", label);
  g.setAttribute("data-label-safe", labelSafe);
  const node = document.createElementNS(NS, "circle") as SVGCircleElement;
  node.setAttribute("class", "scatter-point");
  node.setAttribute("fill", fallback);
  node.setAttribute("visibility", "hidden");
  g.appendChild(node);
  return { root: g, target: node };
};

export interface ScatterCanvasOptions {
  width: number;
  height: number;
}

function drawMark(ctx: CanvasRenderingContext2D, p: ScatterPointModel, color: string): void {
  ctx.beginPath();
  if (p.shape === "square") {
    ctx.rect(p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2);
  } else if (p.shape === "triangle") {
    ctx.moveTo(p.cx, p.cy - p.r);
    ctx.lineTo(p.cx + p.r, p.cy + p.r);
    ctx.lineTo(p.cx - p.r, p.cy + p.r);
    ctx.closePath();
  } else {
    ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
  }
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

export function drawScatterCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: ScatterRenderModel,
  o: ScatterCanvasOptions
): Map<string, string> {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return new Map();
  const { ctx } = setup;

  const labels = [...new Set(model.points.map((p) => p.label))];
  const fallback = new Map(model.points.map((p) => [p.label, p.color]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeGroupedScatterProbe,
    "fill"
  );

  for (const p of model.points) {
    ctx.save();
    ctx.globalAlpha = p.dimmed ? 0.1 : 0.9;
    drawMark(ctx, p, fillColors.get(p.label) || p.color);
    ctx.restore();
  }
  // Returned so the engine can colour the canvas-mode crosshair to match the bubble.
  return fillColors;
}
