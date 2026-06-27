// Canvas 2D renderer for FanChart — draws the SAME model the SVG path uses: nested
// band area paths (graduated opacity) then the history/forecast line runs (solid +
// dashed). Colours resolve through the SVG colour probe (resolveMarkColors) so the
// light-DOM contract reaches canvas pixels. jsdom has no 2D context -> no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { LineRenderModel } from "../lineChart/renderModel";

/** One band's pixel-space area path + its (already dim-adjusted) fill opacity. */
export interface FanBandPath {
  label: string;
  safe: string;
  color: string;
  areaPath: string;
  opacity: number;
}

export interface FanCanvasArgs {
  bands: FanBandPath[];
  lineModel: LineRenderModel;
}

export interface FanCanvasOptions {
  width: number;
  height: number;
}

export function drawFanCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  args: FanCanvasArgs,
  o: FanCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return; // jsdom / no 2D context
  const { ctx } = setup;

  // ----- Bands (fill, graduated opacity) — probe the .area fill contract -----
  const bandLabels = [...new Set(args.bands.map((b) => b.label))];
  const bandFallback = new Map(args.bands.map((b) => [b.label, b.color]));
  const fillColors = resolveMarkColors(
    svg,
    bandLabels,
    (l) => bandFallback.get(l) || "transparent",
    makeSimpleProbe("path", "area", "fill"),
    "fill"
  );
  for (const b of args.bands) {
    if (!b.areaPath) continue;
    ctx.save();
    ctx.globalAlpha = b.opacity;
    ctx.fillStyle = fillColors.get(b.label) || b.color;
    ctx.fill(new Path2D(b.areaPath));
    ctx.restore();
  }

  // ----- Line (history solid + forecast median dashed) — probe the .line stroke -----
  const lineLabels = args.lineModel.series.map((s) => s.label);
  const lineFallback = new Map(args.lineModel.series.map((s) => [s.label, s.color]));
  const strokeColors = resolveMarkColors(
    svg,
    lineLabels,
    (l) => lineFallback.get(l) || "transparent",
    makeSimpleProbe("path", "line", "stroke"),
    "stroke"
  );
  for (const s of args.lineModel.series) {
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
    ctx.restore();
  }
}
