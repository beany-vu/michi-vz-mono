// Imperative port of shared/XaxisLinear.tsx — a framework-agnostic, d3-axis-free
// linear/time x-axis builder. Faithful to the legacy tick logic (evenly spaced,
// always include first/last; numeric domains starting at 0 anchor a zero tick)
// and visuals (vertical grid line, hoverable tick dot, centered label). Time
// scales delegate to the scale's own `.ticks()` (no date-fns dependency in core).
//
// Generalized from the GapChart-local axis so LineChart/AreaChart (Phase 3) and
// every later chart share ONE x-axis builder.
import { svgEl } from "../../dom";
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
  const values = numericTickValues(scale, o);
  const last = values.length - 1;

  values.forEach((v, i) => {
    const px =
      o.xAxisDataType === "number" ? (scale(v) as number) : (scale(new Date(v)) as number);
    if (!Number.isFinite(px)) return;
    const isZero = o.xAxisDataType === "number" && v === 0;
    const tickClass =
      "mv-tick" +
      (i === 0 ? " mv-tick-first" : "") +
      (i === last ? " mv-tick-last" : "") +
      (isZero ? " mv-tick-zero" : "");

    if (showGrid) {
      const grid = svgEl("line", {
        class: `mv-grid ${tickClass}`,
        x1: px,
        x2: px,
        y1: top,
        y2: bottom,
      });
      // A zero line (or explicitly requested) renders solid rather than dashed.
      if (isZero && o.showZeroLine) grid.setAttribute("stroke-dasharray", "none");
      g.appendChild(grid);
    }

    g.appendChild(
      svgEl("circle", { class: "mv-tick-dot", cx: px, cy: bottom + 8, r: 2, fill: "lightgray" })
    );

    const label = svgEl("text", {
      class: "mv-axis-label",
      x: px,
      y: bottom + 26,
      "text-anchor": "middle",
    });
    label.textContent = o.format(v);
    g.appendChild(label);
  });

  parent.appendChild(g);
  return g;
}
