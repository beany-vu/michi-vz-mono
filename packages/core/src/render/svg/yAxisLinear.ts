// Imperative port of shared/YaxisLinear.tsx - linear (numeric) y-axis: horizontal
// grid line + right-aligned label per tick, ticks from the scale's own .ticks().
// Used by value-axis charts (LineChart, AreaChart, …); band charts use
// renderYAxisBand instead.
import { svgEl } from "../../dom";
import type { ScaleLinear, ScaleLogarithmic } from "d3-scale";
import type { Margin } from "../../types";

// Mirrors xAxisLinear.ts's LinearOrTimeScale: a chart-agnostic local alias (this
// render layer stays decoupled from any one chart's pure-layer types) covering the
// two y-scale kinds a value axis can be built with (LineChart's log mode being the
// only current source of the log branch).
export type LinearOrLogScale = ScaleLinear<number, number> | ScaleLogarithmic<number, number>;

export interface YAxisLinearOptions {
  width: number;
  height: number;
  margin: Margin;
  format: (d: number) => string;
  ticks?: number;
  showGrid?: boolean;
  /** Emphasise the y=0 grid line with a darker solid stroke (default false). */
  highlightZeroLine?: boolean;
}

// Log axes only: a scale is "log" iff it exposes .base() - ScaleLinear has no such
// method. Duck-typed rather than threaded through as a new option/prop, since the
// only current caller passing a log scale is LineChart (see lineChart/scales.ts) and
// every other renderYAxisLinear consumer (VerticalStackBar, ComparableVerticalBar,
// FanChart, RangeChart, RibbonChart, FountainChart, AreaChart, ScatterChart) only
// ever builds a ScaleLinear, so this is a no-op for all of them.
function isLogScale(scale: LinearOrLogScale): scale is ScaleLogarithmic<number, number> {
  return typeof (scale as ScaleLogarithmic<number, number>).base === "function";
}

// d3's own log-axis convention: once a domain spans more than ~2 decades, labeling
// every minor tick (1,2,3…9,10,20,30…) overprints into an unreadable smear (observed
// live on a 4-decade LineChart yAxisScale="log" domain, 0.0007…446). Past the
// threshold, only the powers of the base get a text label; narrower domains keep
// today's per-tick labeling (d3's default tickFormat() already blanks non-round
// values there in practice, so there is no smear to fix).
const LOG_LABEL_DECADE_THRESHOLD = 2;

// Powers of 10 that fall within [lo, hi] (inclusive), computed from the domain
// bounds directly rather than filtered out of scale.ticks(count) - the latter's own
// count-driven thinning can skip a decade boundary on a very wide domain (e.g.
// scaleLog().domain([1, 1e10]).ticks(3) => [1, 1e5, 1e10], silently dropping
// 10/100/.../1e9), so it can't be trusted to preserve every power of 10 in range.
function powersOfTenInRange(lo: number, hi: number): number[] {
  const EPS = 1e-9;
  const loExp = Math.ceil(Math.log10(lo) - EPS);
  const hiExp = Math.floor(Math.log10(hi) + EPS);
  const result: number[] = [];
  // `Number(\`1e${e}\`)` (not Math.pow(10, e)/10**e) - both of the latter pick up
  // floating-point rounding error on negative exponents (Math.pow(10,-4) ===
  // 0.00009999999999999999, not 0.0001), which would silently fail to match the
  // exact tick values d3's own scaleLog().ticks() produces for the same boundary.
  for (let e = loExp; e <= hiExp; e++) result.push(Number(`1e${e}`));
  return result;
}

interface TickPlan {
  /** Every value that gets a gridline (when showGrid). */
  tickValues: number[];
  /** Subset of tickValues that also gets a text label. */
  labelValues: Set<number>;
}

function planTicks(scale: LinearOrLogScale, ticksOption: number | undefined): TickPlan {
  const rawTicks = scale.ticks(ticksOption ?? 5);
  if (!isLogScale(scale)) {
    return { tickValues: rawTicks, labelValues: new Set(rawTicks) };
  }

  const [lo, hi] = scale.domain();
  if (!(lo > 0) || !(hi > 0) || lo >= hi) {
    return { tickValues: rawTicks, labelValues: new Set(rawTicks) };
  }

  const decades = Math.log10(hi / lo);
  if (decades <= LOG_LABEL_DECADE_THRESHOLD) {
    return { tickValues: rawTicks, labelValues: new Set(rawTicks) };
  }

  // Wide log domain: label only the powers of 10, but guarantee each one is
  // actually rendered as a tick (union with the raw ticks) even if
  // scale.ticks(count) itself thinned past a boundary.
  const powers = powersOfTenInRange(lo, hi);
  const tickSet = new Set(rawTicks);
  for (const p of powers) tickSet.add(p);
  return {
    tickValues: Array.from(tickSet).sort((a, b) => a - b),
    labelValues: new Set(powers),
  };
}

export function renderYAxisLinear(
  parent: SVGElement,
  scale: LinearOrLogScale,
  o: YAxisLinearOptions,
): SVGGElement {
  const g = svgEl("g", { class: "mv-y-axis mv-y-axis-linear" });
  const showGrid = o.showGrid !== false;
  const left = o.margin.left;
  const right = o.width - o.margin.right;

  const { tickValues, labelValues } = planTicks(scale, o.ticks);

  for (const v of tickValues) {
    const py = scale(v);
    if (!Number.isFinite(py)) continue;

    if (showGrid) {
      const isZero = v === 0 && o.highlightZeroLine;
      g.appendChild(
        svgEl("line", {
          class: isZero ? "mv-grid mv-zero-line" : "mv-grid",
          x1: left,
          x2: right,
          y1: py,
          y2: py,
        }),
      );
    }

    if (!labelValues.has(v)) continue;

    const label = svgEl("text", {
      class: "mv-axis-label",
      x: left - 8,
      y: py,
      "text-anchor": "end",
      "dominant-baseline": "middle",
    });
    label.textContent = o.format(v);
    g.appendChild(label);
  }

  parent.appendChild(g);
  return g;
}
