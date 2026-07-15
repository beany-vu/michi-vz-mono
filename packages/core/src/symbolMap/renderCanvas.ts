// Opt-in Canvas 2D renderer for SymbolMap. Single-element circle marks (no
// sub-marks, like BubbleChart's plain circles) - the colour contract is a plain
// `circle.symbol[data-label-safe]` probe (makeSimpleProbe), same convention as
// every single-mark chart. The optional backdrop draws first via
// geoPath(projection, ctx) (d3-geo renders natively to a 2D context - see
// ChoroplethMap's renderCanvas.ts), then the symbol circles on top.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { readableTextColor } from "../math/contrast";
import { createGeoPathGenerator } from "../geo/projections";
import type { SymbolMapRenderModel } from "./renderModel";

export interface SymbolMapCanvasOptions {
  width: number;
  height: number;
  showLabels: boolean;
  geographyColor: string;
  strokeColor: string;
  strokeWidth: number;
}

function fitText(text: string, r: number, charPx = 6.2): string {
  const max = Math.floor((r * 2 - 6) / charPx);
  if (max <= 0) return "";
  if (text.length <= max) return text;
  if (max <= 1) return "";
  return text.slice(0, max - 1) + "…";
}

export function drawSymbolMapCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: SymbolMapRenderModel,
  o: SymbolMapCanvasOptions,
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  if (model.backdrop.length > 0) {
    const pathGen = createGeoPathGenerator(model.projection, ctx);
    ctx.fillStyle = o.geographyColor;
    ctx.strokeStyle = o.strokeColor;
    ctx.lineWidth = o.strokeWidth;
    for (const b of model.backdrop) {
      if (!b.geometry) continue;
      ctx.beginPath();
      pathGen({ type: "Feature", properties: {}, geometry: b.geometry });
      ctx.fill();
      ctx.stroke();
    }
  }

  const labels = model.symbols.map((m) => m.colorKey);
  const fallback = new Map(model.symbols.map((m) => [m.colorKey, m.fill]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("circle", "symbol", "fill"),
    "fill",
  );

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

  for (const m of model.symbols) {
    const fill = fillColors.get(m.colorKey) || m.fill;
    ctx.globalAlpha = (m.dimmed ? 0.3 : 1) * m.opacity;
    ctx.fillStyle = fill;
    disc(m.x, m.y, m.radius);

    if (m.radiusSecond != null) {
      ctx.globalAlpha = (m.dimmed ? 0.3 : 1) * (m.opacitySecond ?? m.opacity);
      disc(m.x, m.y, m.radiusSecond);
    }

    if (o.showLabels) {
      const radiusThreshold =
        m.radiusSecond != null ? Math.max(m.radius, m.radiusSecond) : m.radius;
      if (radiusThreshold >= 16) {
        ctx.globalAlpha = m.dimmed ? 0.3 : 1;
        ctx.fillStyle = readableTextColor(fill);
        ctx.font = `${Math.round(fs * 0.92)}px ${fam}`;
        ctx.fillText(fitText(m.label, radiusThreshold), m.x, m.y);
      }
    }
  }
  ctx.globalAlpha = 1;
}
