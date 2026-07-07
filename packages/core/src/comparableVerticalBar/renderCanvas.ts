// Opt-in Canvas 2D renderer for ComparableVerticalBar. Each category has two
// sub-bars (value-based, value-compared; per-row z-order - see renderModel.ts's
// comparableVerticalDrawOrder). Sub-bar fill colours are resolved via DUAL nested probes so
// descendant consumer CSS (`.bar[data-label-safe] .value-based`) matches;
// ['fill','stroke'] lets a `url(#pattern)` fill fall through to the stroke
// colour. value-based may instead be filled with a hatch PATTERN from
// patternsMapping (the data-URI from createHatchPattern), tiled via
// ctx.createPattern. jsdom -> no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSubBarProbe } from "../canvas/resolveMarkColors";
import { comparableVerticalDrawOrder } from "./renderModel";
import type { ComparableVerticalRenderModel } from "./renderModel";

export interface ComparableVerticalCanvasOptions {
  width: number;
  height: number;
  valueBasedOpacity: number;
  valueComparedOpacity: number;
  /** label -> image source (data-URI) used to fill the value-based sub-bar. */
  patternsMapping?: Record<string, string>;
}

// Cache of loaded hatch images keyed by data-URI (module scope - shared across
// re-renders so a pattern loads once).
const patternImageCache = new Map<string, HTMLImageElement>();

function getPatternImage(src: string, onLoad: () => void): HTMLImageElement | null {
  const cached = patternImageCache.get(src);
  if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : null;
  if (typeof Image === "undefined") return null;
  const img = new Image();
  img.onload = onLoad;
  img.src = src;
  patternImageCache.set(src, img);
  return null; // not ready this frame; onLoad triggers a re-render
}

const isTransparent = (c: string): boolean =>
  c === "transparent" || c === "rgba(0, 0, 0, 0)" || c === "rgba(0,0,0,0)";

// Rounded-rect path (radius clamped to half the smaller side). Uses
// ctx.roundRect where available, else arcTo.
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rad = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    (ctx as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(x, y, w, h, rad);
    return;
  }
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function drawComparableVerticalCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: ComparableVerticalRenderModel,
  o: ComparableVerticalCanvasOptions,
  onPatternLoad?: () => void
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const labels = model.bars.map((b) => b.label);
  const fb = (l: string) => model.bars.find((b) => b.label === l)?.color || "transparent";
  const fbBased = (l: string) => model.bars.find((b) => b.label === l)?.basedColor || "transparent";
  const basedColors = resolveMarkColors(svg, labels, fbBased, makeSubBarProbe("value-based"), ["fill", "stroke"]);
  const comparedColors = resolveMarkColors(svg, labels, fb, makeSubBarProbe("value-compared"), ["fill", "stroke"]);

  for (const bar of model.bars) {
    const groupAlpha = bar.dimmed ? 0.3 : 1;
    const patSrc = o.patternsMapping?.[bar.label] ?? o.patternsMapping?.[bar.safe];
    const parts = comparableVerticalDrawOrder(bar).map((type) =>
      type === "based"
        ? { seg: bar.based, opacity: o.valueBasedOpacity, color: basedColors.get(bar.label) || bar.basedColor, pattern: patSrc }
        : { seg: bar.compared, opacity: o.valueComparedOpacity, color: comparedColors.get(bar.label) || bar.color, pattern: undefined as string | undefined }
    );
    for (const part of parts) {
      // transparent-skip: a consumer hides a sub-bar with fill:transparent - don't
      // paint it (unless it's pattern-filled).
      if (isTransparent(part.color) && !part.pattern) continue;

      let fillStyle: string | CanvasPattern = part.color;
      if (part.pattern) {
        const img = getPatternImage(part.pattern, onPatternLoad ?? (() => {}));
        if (img) {
          const pat = ctx.createPattern(img, "repeat");
          if (pat) fillStyle = pat;
        } else {
          continue; // image still loading; re-render fires on load
        }
      }
      ctx.globalAlpha = groupAlpha * part.opacity;
      ctx.fillStyle = fillStyle;
      roundRectPath(ctx, part.seg.x, part.seg.y, part.seg.width, part.seg.height, 5);
      ctx.fill();
      // 1px border in the resolved colour, so the bar reads as an outlined
      // rounded rect (and the hatch fill gets a clean edge).
      ctx.strokeStyle = part.color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
