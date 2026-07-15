// Opt-in Canvas 2D renderer for RadialTree. Paints the SAME links + sized
// circles + adaptive labels the SVG renderer does (no DOM); circle fill is
// resolved through the SAME single-element colour probe every dual-mark-free
// chart uses (class `radial-tree-node-circle`, keyed by the colour-group,
// `fill`). Label offsets/rotation are ported from the SVG renderer's em-unit +
// `rotate()` transform via an equivalent translate+rotate+fillText.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { RadialTreeRenderModel } from "./renderModel";

export interface RadialTreeCanvasOptions {
  width: number;
  height: number;
  /** Plot-local translation to the polar origin (margin.left + innerWidth/2, etc.). */
  centerX: number;
  centerY: number;
  /** Progressive-draw reveal cutoff (canvas-local x, i.e. already shifted by the
   *  margin the caller applied via `canvas.style.left`): only pixels at
   *  x <= revealX are painted (a ctx.clip rect, before the polar translate). */
  revealX?: number;
}

export function drawRadialTreeCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: RadialTreeRenderModel,
  o: RadialTreeCanvasOptions,
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  if (o.revealX !== undefined) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, Math.max(0, o.revealX), o.height);
    ctx.clip();
  }

  ctx.translate(o.centerX, o.centerY);

  const fallback = new Map<string, string>();
  for (const m of model.marks) if (!fallback.has(m.colorKey)) fallback.set(m.colorKey, m.fill);
  const fillColors = resolveMarkColors(
    svg,
    model.marks.map((m) => m.colorKey),
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("circle", "radial-tree-node-circle", "fill"),
    "fill",
  );

  const cs =
    svg && typeof window !== "undefined" && window.getComputedStyle
      ? window.getComputedStyle(svg)
      : null;
  const ink = (cs && cs.color) || "#2a1c15";
  const fam = (cs && cs.fontFamily) || "sans-serif";
  const fs = (cs && parseFloat(cs.getPropertyValue("--michi-vz-font-size"))) || 12;

  // Links first (background layer - every circle paints on top of every link,
  // slightly simpler than the legacy per-node DOM interleaving but visually
  // equivalent: a link never obscures a circle).
  ctx.strokeStyle = "rgba(120,120,120,0.4)";
  ctx.lineWidth = 1;
  for (const m of model.marks) {
    const { start, c1, c2, end } = m.link;
    ctx.globalAlpha = m.dimmed ? 0.15 : 0.4;
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], end[0], end[1]);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.font = `${Math.round(fs * 0.92)}px ${fam}`;
  for (const m of model.marks) {
    const alpha = m.dimmed ? 0.3 : 1;

    if (m.labelText) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ink;
      ctx.textAlign = m.textAnchor === "middle" ? "center" : m.textAnchor;
      ctx.translate(m.x, m.y);
      ctx.rotate((m.rotateDeg * Math.PI) / 180);
      const text = m.valueText ? `${m.labelText} ${m.valueText}` : m.labelText;
      ctx.fillText(text, m.offsetXEm * fs, m.offsetYEm * fs);
      ctx.restore();
    }

    ctx.globalAlpha = alpha * 0.5; // legacy RadialCircle fixed opacity
    ctx.fillStyle = fillColors.get(m.colorKey) || m.fill;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.markRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (model.centerRadius > 0) {
    ctx.fillStyle = (cs && cs.getPropertyValue("--michi-vz-surface")) || "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, model.centerRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  if (model.centerLines.length > 0) {
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    for (const line of model.centerLines) {
      ctx.fillText(line.text, 0, line.dy);
    }
  }

  if (o.revealX !== undefined) ctx.restore();
}
