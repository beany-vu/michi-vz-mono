// Opt-in Canvas 2D renderer for Bubble. Paints the same circles the SVG renderer
// does (no DOM); fill colours resolved via the SVG colour probe (class `bubble`,
// fill) so consumer CSS reaches canvas pixels. jsdom has no 2D context → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { readableTextColor } from "../math/contrast";
import type { BubbleRenderModel } from "./renderModel";

export interface BubbleCanvasOptions {
  width: number;
  height: number;
}

function fitText(text: string, r: number, charPx = 6.2): string {
  const max = Math.floor((r * 2 - 6) / charPx);
  if (max <= 0) return "";
  if (text.length <= max) return text;
  if (max <= 1) return "";
  return text.slice(0, max - 1) + "…";
}

export function drawBubbleCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: BubbleRenderModel,
  o: BubbleCanvasOptions,
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const fallback = new Map<string, string>();
  for (const b of model.bubbles) if (!fallback.has(b.colorKey)) fallback.set(b.colorKey, b.fill);
  const fillColors = resolveMarkColors(
    svg,
    model.groupKeys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("circle", "bubble", "fill"),
    "fill",
  );

  const anyHighlight = model.highlightSet.size > 0;
  const veil = Math.max(0, Math.min(0.95, 1 - model.splitOpacity));
  const cs =
    svg && typeof window !== "undefined" && window.getComputedStyle
      ? window.getComputedStyle(svg)
      : null;
  const fam = (cs && cs.fontFamily) || "sans-serif";
  const fs = (cs && parseFloat(cs.getPropertyValue("--michi-vz-font-size"))) || 12;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const disc = (x: number, y: number, r: number): void => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  for (const d of model.bubbles) {
    const highlighted = !anyHighlight || model.highlightSet.has(d.label);
    const groupOpacity = highlighted ? 1 : 0.2;
    const fill = fillColors.get(d.colorKey) || d.fill;

    ctx.globalAlpha = groupOpacity;
    ctx.fillStyle = fill;
    disc(d.x, d.y, d.r);

    if (model.showSplit && d.partialPct != null && d.realizedRadius < d.r) {
      ctx.globalAlpha = groupOpacity * veil;
      ctx.fillStyle = "#ffffff";
      disc(d.x, d.y, d.r);
      ctx.globalAlpha = groupOpacity;
      ctx.fillStyle = fill;
      disc(d.x, d.y, d.realizedRadius);
    }

    if (model.showLabels && d.r >= 16) {
      ctx.globalAlpha = groupOpacity;
      ctx.fillStyle = readableTextColor(fill);
      ctx.font = `${Math.round(fs * 0.92)}px ${fam}`;
      ctx.fillText(fitText(d.code ? `${d.code}` : d.label, d.r), d.x, d.y);
    }
  }
  ctx.globalAlpha = 1;
}
