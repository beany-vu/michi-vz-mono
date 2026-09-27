// Opt-in Canvas 2D renderer for FountainChart: draws the shared render model with the
// same marks, opacities and dashes as SVG (SPEC section 4). The lake and the
// reference lines are chart furniture and paint outside the reveal clip; the trend
// line and the jets paint under it (a ctx.clip rect matching the SVG <clipPath>).
// Text stays SVG in every renderer. Colours are resolved per jet through the light-DOM
// probe (fountainPaintColors), so consumer CSS on [data-label-safe] wins as in SVG and
// a per-item colour inside a repeated label is honoured. jsdom has no 2D context:
// a no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { sanitizeForClassName } from "../math/sanitize";
import { FOUNTAIN_DIM_OPACITY, FOUNTAIN_LAKE_HEIGHT } from "./renderSvg";
import type { FountainJetModel, FountainRenderModel } from "./renderModel";

/** Resolved theme colours for the painted renderers (read from the host's CSS). */
export interface FountainPaintTheme {
  /** --michi-vz-ink: the trend line */
  ink: string;
  /** --michi-vz-surface: the chart's background colour, for the rings round the dots */
  surface: string;
  /** --michi-vz-attention: the reference lines */
  attention: string;
  /** --michi-vz-lake: the band at y = 0 */
  lake: string;
}

export interface FountainCanvasOptions extends FountainPaintTheme {
  width: number;
  height: number;
  /** Reveal cutoff: jets and the trend line paint only at x <= revealX */
  revealX?: number;
}

const probe = makeSimpleProbe("path", "mv-fountain-jet", "fill");

/**
 * The paint colour of every jet: its own colour (colorsMapping ?? item.color ?? the
 * label's) unless consumer CSS on its data-label-safe sets a fill, which wins, the same
 * way it wins over the SVG fill. One probe per distinct (label, colour).
 */
export function fountainPaintColors(
  svg: SVGSVGElement | null,
  jets: ReadonlyArray<Pick<FountainJetModel, "label" | "color">>,
): (jet: Pick<FountainJetModel, "label" | "color">) => string {
  const SEP = "\u0000";
  const keyOf = (j: Pick<FountainJetModel, "label" | "color">): string =>
    `${j.label}${SEP}${j.color}`;
  const keys = [...new Set(jets.map(keyOf))];
  const split = (key: string): [string, string] => {
    const at = key.indexOf(SEP);
    return [key.slice(0, at), key.slice(at + 1)];
  };
  const resolved = resolveMarkColors(
    svg,
    keys,
    (key) => split(key)[1] || "transparent",
    (key, _safe, fallback) => {
      const label = split(key)[0];
      return probe(label, sanitizeForClassName(label), fallback);
    },
    "fill",
  );
  return (j) => resolved.get(keyOf(j)) || j.color;
}

export function drawFountainCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: FountainRenderModel,
  o: FountainCanvasOptions,
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;
  const colorOf = fountainPaintColors(svg, model.jets);

  // Furniture, never clipped: the lake and the reference lines.
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = o.lake;
  ctx.fillRect(model.lake.x0, model.lake.y, model.lake.x1 - model.lake.x0, FOUNTAIN_LAKE_HEIGHT);
  ctx.globalAlpha = 1;
  for (const line of model.referenceLines) {
    ctx.strokeStyle = o.attention;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(line.x0, line.y);
    ctx.lineTo(line.x1, line.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  const clipped = o.revealX !== undefined;
  if (clipped) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, Math.max(0, o.revealX as number), o.height);
    ctx.clip();
  }

  // A forecast's hollow big dot shows the real background: everything painted from
  // here on (the trend line, the stems, the bells) is clipped out of its inside, the
  // canvas twin of the SVG knockout. Its 2 px ring (centred on r) stays.
  const hollow = model.jets.filter((j) => j.bigDot.hollow).map((j) => j.bigDot);
  if (hollow.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, o.width, o.height);
    for (const b of hollow) {
      const r = Math.max(0, b.r - 1);
      ctx.moveTo(b.x + r, b.y);
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2, true);
    }
    ctx.clip("evenodd");
  }

  if (model.trendLine) {
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = o.ink;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    model.trendLine.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const jet of model.jets) {
    const color = colorOf(jet);
    const dim = jet.dimmed ? FOUNTAIN_DIM_OPACITY : 1;

    // Stem: a rounded bar to the big dot, or a dashed line for a forecast.
    const s = jet.stem;
    ctx.globalAlpha = dim * 0.75;
    if (s.dashed) {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, s.width - 1.2);
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y0);
      ctx.lineTo(s.x, s.y1);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Round ends, as the SVG rect (rx = width / 2); a plain bar where roundRect is missing.
      const x0 = s.x - s.width / 2;
      const y0 = Math.min(s.y0, s.y1);
      const h = Math.abs(s.y0 - s.y1);
      ctx.fillStyle = color;
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(x0, y0, s.width, h, Math.min(s.width / 2, h / 2));
        ctx.fill();
      } else {
        ctx.fillRect(x0, y0, s.width, h);
      }
    }

    // Bell: light fill, stronger outline; dashed and lighter for a forecast.
    if (jet.bell) {
      ctx.beginPath();
      jet.bell.points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.globalAlpha = dim * (jet.bell.dashed ? 0.06 : 0.13);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = dim * (jet.bell.dashed ? 0.6 : 0.7);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.lineJoin = "round";
      if (jet.bell.dashed) ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Small dots with a surface hairline.
    for (const d of jet.dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.globalAlpha = dim * 0.9;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = dim;
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = o.surface;
      ctx.stroke();
    }

    // Big dot: colour with a surface ring, or hollow (a colour ring, nothing inside).
    const b = jet.bigDot;
    ctx.globalAlpha = dim;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    if (!b.hollow) {
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = b.hollow ? color : o.surface;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  if (hollow.length > 0) ctx.restore();
  if (clipped) ctx.restore();
}
