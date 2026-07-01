// Renderer-agnostic Pie model - consumed by SVG, canvas, hit-test, and context.
// One mark per slice (path around origin + centroid + angles); the geometry is
// centred at (cx,cy), which the renderers translate to. Highlight dimming is
// applied at draw time (not baked here).
import { sanitizeForClassName } from "../math/sanitize";
import type { PieColorResolver } from "./colors";
import type { PieArc } from "./geometry";

export interface PieSliceMark {
  label: string;
  code?: string;
  /** Colour-group key (the slice label). */
  colorKey: string;
  /** sanitizeForClassName(label) - the colour contract. */
  dataLabelSafe: string;
  fill: string;
  value: number;
  /** value / total in [0,1]. */
  share: number;
  startAngle: number;
  endAngle: number;
  /** Path "d" around the origin (renderer translates by cx,cy). */
  d: string;
  /** Centroid around the origin. */
  labelX: number;
  labelY: number;
  /** Pre-rounded percent text, e.g. "42%". */
  pctText: string;
}

export interface PieLegendItem {
  label: string;
  color: string;
}

export interface PieRenderModel {
  cx: number;
  cy: number;
  radius: number;
  innerRadius: number;
  mode: "pie" | "donut";
  slices: PieSliceMark[];
  groupKeys: string[];
  legend: PieLegendItem[];
  total: number;
  highlightSet: Set<string>;
  showLabels: boolean;
}

export interface BuildPieModelOptions {
  cx: number;
  cy: number;
  radius: number;
  innerRadiusRatio: number;
  groupKeys: string[];
  total: number;
  highlightItems: string[];
  showLabels: boolean;
  showLegend: boolean;
}

export function buildPieRenderModel(
  arcs: PieArc[],
  colors: PieColorResolver,
  o: BuildPieModelOptions
): PieRenderModel {
  const innerRadius = Math.max(0, Math.min(0.95, o.innerRadiusRatio)) * o.radius;
  const slices: PieSliceMark[] = arcs.map((a) => {
    const share = o.total > 0 ? a.data.value / o.total : 0;
    return {
      label: a.data.label,
      code: a.data.code,
      colorKey: a.data.label,
      dataLabelSafe: sanitizeForClassName(a.data.label),
      fill: colors.getColor(a.data.label),
      value: a.data.value,
      share,
      startAngle: a.startAngle,
      endAngle: a.endAngle,
      d: a.d,
      labelX: a.labelX,
      labelY: a.labelY,
      pctText: `${Math.round(share * 100)}%`,
    };
  });

  const legend: PieLegendItem[] = o.showLegend
    ? slices.map((s) => ({ label: s.label, color: s.fill }))
    : [];

  return {
    cx: o.cx,
    cy: o.cy,
    radius: o.radius,
    innerRadius,
    mode: innerRadius > 0 ? "donut" : "pie",
    slices,
    groupKeys: o.groupKeys,
    legend,
    total: o.total,
    highlightSet: new Set(o.highlightItems),
    showLabels: o.showLabels,
  };
}
