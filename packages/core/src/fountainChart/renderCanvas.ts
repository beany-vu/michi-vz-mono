// Opt-in Canvas 2D renderer for FountainChart. Same render model as SVG; fill
// colour is resolved through the SVG probe (resolveMarkColors `mv-fountain-jet`/
// fill) so the light-DOM colour contract reaches canvas pixels. The trend line
// honours the same ink colour the SVG uses (passed in from the host). jsdom -> no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { FountainRenderModel } from "./renderModel";

export interface FountainCanvasOptions {
  width: number;
  height: number;
  /** resolved ink colour for the trend line (matches the SVG var(--michi-vz-ink,currentColor)) */
  inkColor: string;
}

export function drawFountainCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: FountainRenderModel,
  o: FountainCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

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

  if (model.trendLinePath) {
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = o.inkColor || "rgba(130,130,130,1)";
    ctx.lineWidth = 1.5;
    ctx.stroke(new Path2D(model.trendLinePath));
  }

  for (const jet of model.jets) {
    const color = colorOf(jet.label, jet.color);

    if (jet.mistPath) {
      ctx.globalAlpha = (jet.dimmed ? 0.3 : 1) * 0.1;
      ctx.fillStyle = color;
      ctx.fill(new Path2D(jet.mistPath));
    }
    jet.slicePaths.forEach((path, i) => {
      ctx.globalAlpha = jet.sliceOpacities[i];
      ctx.fillStyle = color;
      ctx.fill(new Path2D(path));
    });
    if (jet.predicted) {
      ctx.globalAlpha = jet.dimmed ? 0.3 : 0.8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke(new Path2D(jet.outlinePath));
      ctx.setLineDash([]);
    }
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    for (const dp of jet.dropletPaths) {
      ctx.globalAlpha = (jet.dimmed ? 0.3 : 1) * 0.45;
      ctx.strokeStyle = color;
      ctx.stroke(new Path2D(dp));
    }
    ctx.lineCap = "butt";
  }

  ctx.globalAlpha = 1;
}
