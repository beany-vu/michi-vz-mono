// Opt-in Canvas 2D renderer for LineChart. Draws the SAME render model the SVG
// renderer uses (run path strings via Path2D, in pixel space) onto a <canvas>
// layered behind the <svg>. Stroke colours are resolved through the SVG colour
// probe (resolveMarkColors with the `line`/stroke contract) so consumer CSS
// (.line[data-label-safe] { stroke }) reaches canvas pixels - the light-DOM
// contract. jsdom has no 2D context -> setupCanvas returns null and this no-ops.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { drawTipLabelsCanvas, type TipLabelTarget } from "./progressiveDraw";
import type { LineRenderModel } from "./renderModel";
import { withAlpha, type ResolvedLineAreaFill } from "./areaFill";
import type { Shape, SinglePointLineConfig } from "../types";

export interface LineCanvasOptions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  showDataPoints: boolean;
  singlePointLine: SinglePointLineConfig | null;
  /** Progressive-draw reveal cutoff: only pixels at x <= revealX are painted
   *  (a ctx.clip rect, matching the SVG renderer's <clipPath> reveal). */
  revealX?: number;
  /** Horizontal clip to [x0, x1] px (the plot box while zoomed) so marks whose
   *  points project outside the zoomed domain don't paint over the axes. Same
   *  ctx.clip mechanism as revealX; both compose (clip intersection). */
  clipX?: [number, number];
  /** Progressive-draw tip labels, drawn OUTSIDE the reveal clip (they trail the
   *  tip to its right, like the SVG labels living outside the <clipPath>). */
  tipLabels?: TipLabelTarget[];
  /** Font family for canvas tip-label text (default sans-serif). */
  fontFamily?: string;
  /** areaFill: vertical gradient from the plot top (topY) to the baseline. */
  areaFill?: { cfg: ResolvedLineAreaFill; topY: number; baselineY: number } | null;
}

function drawPoint(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  x: number,
  y: number,
  color: string,
): void {
  ctx.beginPath();
  if (shape === "square") {
    ctx.rect(x - 6, y - 6, 12, 12);
  } else if (shape === "triangle") {
    const R = 7;
    ctx.moveTo(x, y - R);
    ctx.lineTo(x + R * 0.866, y + R / 2);
    ctx.lineTo(x - R * 0.866, y + R / 2);
    ctx.closePath();
  } else {
    ctx.arc(x, y, 5, 0, Math.PI * 2);
  }
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fdfdfd";
  ctx.stroke();
}

export function drawLineCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: LineRenderModel,
  o: LineCanvasOptions,
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return; // jsdom / no 2D context
  const { ctx } = setup;

  if (o.revealX !== undefined) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, Math.max(0, o.revealX), o.height);
    ctx.clip();
  }

  if (o.clipX !== undefined) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(o.clipX[0], 0, Math.max(0, o.clipX[1] - o.clipX[0]), o.height);
    ctx.clip();
  }

  const labels = model.series.map((s) => s.label);
  const fallback = new Map(model.series.map((s) => [s.label, s.color]));
  const strokeColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("path", "line", "stroke"),
    "stroke",
  );

  // Fills first, all of them, so no fill covers another series' line.
  if (o.areaFill) {
    const a = o.areaFill;
    for (const s of model.series) {
      if (!s.areaPath) continue;
      const color = strokeColors.get(s.label) || s.color;
      const grad = ctx.createLinearGradient(0, a.topY, 0, a.baselineY);
      grad.addColorStop(0, withAlpha(color, a.cfg.topOpacity));
      grad.addColorStop(1, withAlpha(color, a.cfg.bottomOpacity));
      ctx.save();
      ctx.globalAlpha = s.dimmed ? 0.05 : 1;
      ctx.fillStyle = grad;
      ctx.fill(new Path2D(s.areaPath));
      ctx.restore();
    }
  }

  for (const s of model.series) {
    const color = strokeColors.get(s.label) || s.color;
    ctx.save();
    ctx.globalAlpha = s.dimmed ? 0.05 : 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (const run of s.runs) {
      if (!run.path) continue;
      ctx.setLineDash(run.certain ? [] : [4, 4]);
      ctx.stroke(new Path2D(run.path));
    }
    ctx.setLineDash([]);

    if (s.singlePointY !== null && o.singlePointLine) {
      const cfg = o.singlePointLine;
      ctx.save();
      ctx.strokeStyle = cfg.stroke ?? color;
      ctx.lineWidth = cfg.strokeWidth ?? 2.5;
      ctx.setLineDash(cfg.strokeDasharray ? [4, 4] : []);
      ctx.beginPath();
      ctx.moveTo(o.margin.left, s.singlePointY);
      ctx.lineTo(o.width - o.margin.right, s.singlePointY);
      ctx.stroke();
      ctx.restore();
    }

    if (o.showDataPoints) {
      for (const p of s.points) drawPoint(ctx, s.shape, p.x, p.y, color);
    }
    ctx.restore();
  }

  if (o.clipX !== undefined) ctx.restore();
  if (o.revealX !== undefined) ctx.restore();

  if (o.tipLabels && o.tipLabels.length > 0) {
    drawTipLabelsCanvas(ctx, o.tipLabels, o.fontFamily ?? "sans-serif");
  }
}
