// Pie/donut geometry - the only d3-shape call site. Builds one arc per slice
// (path string + centroid), all measured around the origin (0,0); the renderers
// translate by (cx,cy). Input is already in render order, so pie().sort(null)
// preserves it. innerRadiusRatio 0 = solid pie, >0 = donut hole.
import { pie, arc } from "d3-shape";
import type { PieNode } from "./data";

export interface PieArc {
  data: PieNode;
  /** Radians, clockwise from 12 o'clock. */
  startAngle: number;
  endAngle: number;
  /** SVG path "d" for the slice, around the origin. */
  d: string;
  /** Label anchor (centroid on the mid-ring), around the origin. */
  labelX: number;
  labelY: number;
}

export interface PieGeometryOptions {
  radius: number;
  innerRadiusRatio: number;
  padAngle: number;
  cornerRadius: number;
}

export function layoutPie(nodes: PieNode[], o: PieGeometryOptions): PieArc[] {
  const inner = Math.max(0, Math.min(0.95, o.innerRadiusRatio)) * o.radius;
  const pieGen = pie<PieNode>()
    .value((d) => d.value)
    .sort(null) // input order is already resolved in the data layer
    .padAngle(o.padAngle);
  const arcGen = arc<ReturnType<typeof pieGen>[number]>()
    .innerRadius(inner)
    .outerRadius(o.radius)
    .cornerRadius(o.cornerRadius);
  // Label anchor on a ring midway between the inner and outer radius.
  const labelArc = arc<ReturnType<typeof pieGen>[number]>()
    .innerRadius((inner + o.radius) / 2)
    .outerRadius((inner + o.radius) / 2);

  return pieGen(nodes).map((a) => {
    const [labelX, labelY] = labelArc.centroid(a);
    return {
      data: a.data,
      startAngle: a.startAngle,
      endAngle: a.endAngle,
      d: arcGen(a) ?? "",
      labelX,
      labelY,
    };
  });
}
