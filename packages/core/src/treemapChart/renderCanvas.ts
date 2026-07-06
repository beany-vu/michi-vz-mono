// Opt-in Canvas 2D renderer for Treemap. Paints the same tiles the SVG renderer
// does (no DOM); fill colours resolved via the SVG colour probe (class `tile`,
// fill) so consumer CSS reaches canvas pixels. jsdom has no 2D context → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { readableTextColor } from "../math/contrast";
import type { TreemapRenderModel } from "./renderModel";

export interface TreemapCanvasOptions {
  width: number;
  height: number;
}

function fitText(text: string, w: number, charPx = 6.2): string {
  const max = Math.floor((w - 8) / charPx);
  if (max <= 0) return "";
  if (text.length <= max) return text;
  if (max <= 1) return "";
  return text.slice(0, max - 1) + "…";
}

export function drawTreemapCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: TreemapRenderModel,
  o: TreemapCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const fallback = new Map<string, string>();
  for (const leaf of model.leaves) if (!fallback.has(leaf.colorKey)) fallback.set(leaf.colorKey, leaf.fill);
  const fillColors = resolveMarkColors(
    svg,
    model.groupKeys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("rect", "tile", "fill"),
    "fill"
  );

  const anyHighlight = model.highlightSet.size > 0;
  // Untapped = solid colour + a white veil (matches the SVG renderer; reads as a
  // lighter tint on any background). veil = 1 - splitOpacity.
  const veil = Math.max(0, Math.min(0.95, 1 - model.splitOpacity));
  // Canvas has no CSS: read theme text colour + font (size/family) off the live SVG
  // so it honours --michi-vz-font-size / --michi-vz-font-family + the theme colour.
  const cs =
    svg && typeof window !== "undefined" && window.getComputedStyle
      ? window.getComputedStyle(svg)
      : null;
  const ink = (cs && cs.color) || "#2a1c15";
  const fam = (cs && cs.fontFamily) || "sans-serif";
  const fs = (cs && parseFloat(cs.getPropertyValue("--michi-vz-font-size"))) || 12;
  const fLabel = `${Math.round(fs * 0.92)}px ${fam}`;
  const fPct = `700 ${Math.round(fs * 1.08)}px ${fam}`;

  // Parent containers.
  ctx.strokeStyle = "#d9d9d9";
  ctx.lineWidth = 1;
  for (const c of model.containers) {
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    if (c.w > 28 && model.paddingTop >= 12) {
      ctx.fillStyle = ink;
      ctx.font = `600 ${Math.round(fs * 0.92)}px ${fam}`;
      ctx.textAlign = "left";
      ctx.fillText(fitText(c.label, c.w), c.x + 4, c.y + model.paddingTop - 5);
    }
  }

  for (const d of model.leaves) {
    const highlighted =
      !anyHighlight || model.highlightSet.has(d.label) || model.highlightSet.has(d.colorKey);
    const groupOpacity = highlighted ? 1 : 0.2;
    const fill = fillColors.get(d.colorKey) || d.fill;

    ctx.globalAlpha = groupOpacity;
    ctx.fillStyle = fill;
    ctx.fillRect(d.x, d.y, d.w, d.h);
    if (model.showSplit && d.partialPct != null && d.realizedWidth < d.w) {
      ctx.globalAlpha = groupOpacity * veil;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(d.x + d.realizedWidth, d.y, d.w - d.realizedWidth, d.h);
    }
    ctx.globalAlpha = groupOpacity;

    if (d.h >= 24 && d.w >= 30) {
      ctx.fillStyle = readableTextColor(fill); // auto-contrast against the tile colour
      ctx.textAlign = "left";
      ctx.font = fLabel;
      ctx.fillText(fitText(d.code ? `${d.code}` : d.label, d.w), d.x + 4, d.y + 13);
      // Second-line gate: reused verbatim (not reinvented) from the split
      // percent line below - matches renderSvg.ts's `fitsSecondLine`.
      const fitsSecondLine = d.w >= 48 && d.h >= 34;
      let secondLineY = d.y + 31;
      if (model.showSplit && d.partialPct != null && fitsSecondLine) {
        ctx.font = fPct;
        ctx.fillText(`${Math.round(d.partialPct * 100)}%`, d.x + 4, secondLineY);
        secondLineY += 16; // stack the value label below an already-shown split pct
      }
      if (model.tileValueLabelFormatter && fitsSecondLine) {
        const fraction = model.grandTotal > 0 ? d.value / model.grandTotal : 0;
        ctx.font = fLabel;
        ctx.fillText(
          fitText(model.tileValueLabelFormatter(d.value, fraction, d), d.w),
          d.x + 4,
          secondLineY
        );
      }
    }
  }
  ctx.globalAlpha = 1;
}
