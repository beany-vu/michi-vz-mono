// Circle-radius scale for RadialTree: a LINEAR scale (verified against the legacy
// TreeRadial's `scaleLinear()` - it is NOT a sqrt scale, despite that being the
// more common convention for area-encoded marks) over the domain of every node's
// OWN value - groups (their summed value) AND leaves together, exactly as the
// legacy chart's `rExtent` concatenated both populations. This is what drives
// the "dual-level sized circles" behaviour: a group's circle and its leaves'
// circles share one comparable scale.
import { scaleLinear } from "d3-scale";
import type { RtNode } from "./data";

export type RadiusOf = (value: number) => number;

export function buildRadialTreeRadiusScale(nodes: RtNode[], radiusRange: [number, number]): RadiusOf {
  let min = Infinity;
  let max = -Infinity;
  for (const n of nodes) {
    if (n.value < min) min = n.value;
    if (n.value > max) max = n.value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0;
    max = 1;
  } else if (min === max) {
    // Degenerate (single value, or every node identical): avoid a zero-width
    // domain (scaleLinear would divide by zero) - floor at 0 so every mark still
    // scales to the SAME, non-arbitrary radius (the range's upper bound).
    min = Math.min(0, min);
  }
  const scale = scaleLinear().domain([min, max]).range(radiusRange).clamp(true);
  return (value: number): number => scale(value);
}
