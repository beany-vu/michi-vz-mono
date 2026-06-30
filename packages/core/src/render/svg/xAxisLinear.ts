// Imperative port of shared/XaxisLinear.tsx — a framework-agnostic, d3-axis-free
// linear/time x-axis builder. Faithful to the legacy tick logic (evenly spaced,
// always include first/last; numeric domains starting at 0 anchor a zero tick)
// and visuals (vertical grid line, hoverable tick dot, centered label). Time
// scales delegate to the scale's own `.ticks()` (no date-fns dependency in core).
//
// Generalized from the GapChart-local axis so LineChart/AreaChart (Phase 3) and
// every later chart share ONE x-axis builder.
import { svgEl } from "../../dom";
import { measureLabelWidth } from "./measureLabelWidth";
import type { ScaleLinear, ScaleTime } from "d3-scale";
import type { Margin, XaxisDataType } from "../../types";

export type LinearOrTimeScale =
  | ScaleLinear<number, number>
  | ScaleTime<number, number>;

export interface XAxisLinearOptions {
  width: number;
  height: number;
  margin: Margin;
  xAxisDataType: XaxisDataType;
  /** Formats the numeric tick value (epoch ms for date scales) to a label. */
  format: (d: number) => string;
  ticks?: number;
  /** Explicit tick values override the generated ones (numbers or Dates). */
  tickValues?: Array<number | Date>;
  enableExplicitTickValues?: boolean;
  /** Draw the vertical grid line per tick (default true). */
  showGrid?: boolean;
  /** Render a solid (non-dashed) grid line at x=0 when 0 is in the domain. */
  showZeroLine?: boolean;
  position?: "top" | "bottom";
  /**
   * Measure the rendered labels and, when they would overlap horizontally, tilt
   * them -45° (then thin to a fitting subset if still colliding). Opt-in so charts
   * that already lay out cleanly are unaffected. Mirrors the band-axis chooseAxisMode.
   */
  autoRotate?: boolean;
  /**
   * Hard cap on labels shown. When more candidate ticks than this exist, thin to an
   * even sample that ALWAYS keeps the first + last tick (the axis endpoints). Lets a
   * dense series (e.g. 48 months) collapse to a clean 3–5 labels without losing the ends.
   */
  maxTicks?: number;
}

/** Even index sample keeping first + last; used to thin overcrowded rotated ticks. */
function sampleEvenlyIdx<T>(arr: T[], maxCount: number): T[] {
  if (maxCount < 2) return arr.length ? [arr[0]] : [];
  if (arr.length <= maxCount) return arr;
  const out: T[] = [arr[0]];
  const step = (arr.length - 1) / (maxCount - 1);
  for (let i = 1; i < maxCount - 1; i++) {
    const idx = Math.round(i * step);
    if (idx > 0 && idx < arr.length - 1) out.push(arr[idx]);
  }
  out.push(arr[arr.length - 1]);
  return out;
}

// Numeric values handed to the formatter (the number itself, or epoch ms for dates).
function numericTickValues(scale: LinearOrTimeScale, o: XAxisLinearOptions): number[] {
  if (o.enableExplicitTickValues !== false && o.tickValues && o.tickValues.length > 0) {
    return o.tickValues.map((v) => (v instanceof Date ? v.valueOf() : v));
  }
  const target = Math.min(5, o.ticks ?? 5);
  if (o.xAxisDataType !== "number") {
    return (scale as ScaleTime<number, number>).ticks(target).map((d) => d.valueOf());
  }
  const [first, last] = scale.domain() as [number, number];
  if (target <= 2) return [first, last];
  const out: number[] = [];
  out.push(first === 0 ? 0 : first);
  const step = (last - first) / (target - 1);
  for (let i = 1; i < target - 1; i++) out.push(first + i * step);
  out.push(last);
  // Ensure a zero tick when requested and 0 sits inside the domain.
  if (o.showZeroLine && first <= 0 && 0 <= last && !out.includes(0)) {
    out.push(0);
    out.sort((a, b) => a - b);
  }
  return out;
}

export function renderXAxisLinear(
  parent: SVGElement,
  scale: LinearOrTimeScale,
  o: XAxisLinearOptions
): SVGGElement {
  const g = svgEl("g", { class: "mv-x-axis" });
  const showGrid = o.showGrid !== false;
  const top = o.margin.top;
  const bottom = o.height - o.margin.bottom;

  // Project each tick to a pixel x + its label up front, so autoRotate can measure
  // widths and gaps before committing to a layout.
  let pts = numericTickValues(scale, o)
    .map((v) => ({
      v,
      px: o.xAxisDataType === "number" ? (scale(v) as number) : (scale(new Date(v)) as number),
      label: o.format(v),
    }))
    .filter((p) => Number.isFinite(p.px));

  // Adaptive density (opt-in via autoRotate): show ALL candidate labels while they
  // fit — horizontal first, then tilted -45° (which packs much denser) — and only
  // thin to a small set (keeping the first + last tick) once even the rotated labels
  // would collide. A spacious axis therefore keeps every label; a crammed one (e.g.
  // 48 months) drops to ~maxTicks.
  let rotated = false;
  if (o.autoRotate && pts.length > 1) {
    // Min horizontal spacing two -45° labels need before their text overlaps. A
    // rotated label's neighbours stack diagonally, so this is ~text-height-driven
    // and far smaller than a horizontal label's full width.
    const ROTATED_MIN_SPACING = 18;
    const pad = 6;
    const measure = (): { maxW: number; minGap: number } => {
      let maxW = 0;
      let minGap = Infinity;
      for (let i = 0; i < pts.length; i++) {
        maxW = Math.max(maxW, measureLabelWidth(pts[i].label));
        if (i > 0) minGap = Math.min(minGap, Math.abs(pts[i].px - pts[i - 1].px));
      }
      return { maxW, minGap };
    };
    let { maxW, minGap } = measure();
    if (maxW + pad <= minGap) {
      rotated = false; // every label fits horizontally — show them all
    } else if (minGap >= ROTATED_MIN_SPACING) {
      rotated = true; // every label fits once tilted -45° — show them all, rotated
    } else {
      // Too dense even rotated → thin to a small set (first + last preserved), then
      // re-measure: the surviving few usually fit horizontally.
      pts = sampleEvenlyIdx(pts, Math.max(2, o.maxTicks ?? 5));
      ({ maxW, minGap } = measure());
      rotated = maxW + pad > minGap;
    }
  } else if (o.maxTicks && o.maxTicks >= 2 && pts.length > o.maxTicks) {
    // autoRotate off but an explicit hard cap was requested: thin, keep first+last.
    pts = sampleEvenlyIdx(pts, o.maxTicks);
  }

  const last = pts.length - 1;
  pts.forEach((p, i) => {
    const isZero = o.xAxisDataType === "number" && p.v === 0;
    const tickClass =
      "mv-tick" +
      (i === 0 ? " mv-tick-first" : "") +
      (i === last ? " mv-tick-last" : "") +
      (isZero ? " mv-tick-zero" : "");

    if (showGrid) {
      const grid = svgEl("line", {
        class: `mv-grid ${tickClass}`,
        x1: p.px,
        x2: p.px,
        y1: top,
        y2: bottom,
      });
      // A zero line (or explicitly requested) renders solid rather than dashed.
      if (isZero && o.showZeroLine) grid.setAttribute("stroke-dasharray", "none");
      g.appendChild(grid);
    }

    g.appendChild(
      svgEl("circle", { class: "mv-tick-dot", cx: p.px, cy: bottom + 8, r: 2, fill: "lightgray" })
    );

    if (rotated) {
      // Tilt -45° trailing down-left from the tick (matches the band axis).
      const tickG = svgEl("g", { class: "mv-tick", transform: `translate(${p.px}, ${bottom})` });
      const label = svgEl("text", {
        class: "mv-axis-label",
        transform: "translate(0, 18) rotate(-45)",
        "text-anchor": "end",
      });
      label.textContent = p.label;
      tickG.appendChild(label);
      g.appendChild(tickG);
    } else {
      const label = svgEl("text", {
        class: "mv-axis-label",
        x: p.px,
        y: bottom + 26,
        "text-anchor": "middle",
      });
      label.textContent = p.label;
      g.appendChild(label);
    }
  });

  parent.appendChild(g);
  return g;
}
