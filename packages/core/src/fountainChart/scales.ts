// FountainChart scales: band x (snapshot) or linear/time x (trend), linear y.
// Mirrors the Line/Ribbon scale helpers; the slot width is the per-jet pixel
// budget so neighbouring fountains never collide.
import { scaleBand, scaleLinear, scaleTime } from "d3-scale";
import type { ScaleBand, ScaleLinear, ScaleTime } from "d3-scale";
import type { Margin, XaxisDataType } from "../types";

export type FountainXScale =
  | ScaleBand<string>
  | ScaleLinear<number, number>
  | ScaleTime<number, number>;

export interface FountainScales {
  mode: "snapshot" | "trend";
  /** band scale in snapshot mode, null in trend mode */
  xBand: ScaleBand<string> | null;
  /** linear/time scale in trend mode, null in snapshot mode */
  xLinear: ScaleLinear<number, number> | ScaleTime<number, number> | null;
  yScale: ScaleLinear<number, number>;
  /** per-jet horizontal pixel budget */
  slotWidth: number;
}

export function createFountainScales(
  mode: "snapshot" | "trend",
  labels: string[],
  jetCount: number,
  xDomain: [number, number],
  yDomain: [number, number],
  width: number,
  height: number,
  margin: Margin,
  temporalType: XaxisDataType | null
): FountainScales {
  const plotWidth = Math.max(1, width - margin.left - margin.right);
  let xBand: ScaleBand<string> | null = null;
  let xLinear: ScaleLinear<number, number> | ScaleTime<number, number> | null = null;
  let slotWidth: number;

  if (mode === "snapshot") {
    xBand = scaleBand<string>()
      .domain(labels)
      .range([margin.left, width - margin.right])
      .paddingInner(0.3)
      .paddingOuter(0.15);
    slotWidth = xBand.bandwidth();
  } else {
    if (temporalType === "number") {
      xLinear = scaleLinear()
        .domain([xDomain[0] || 0, xDomain[1] || 1])
        .range([margin.left, width - margin.right])
        .nice();
    } else {
      xLinear = scaleTime()
        .domain([new Date(xDomain[0]), new Date(xDomain[1])])
        .range([margin.left, width - margin.right]);
    }
    slotWidth = Math.max(8, (plotWidth / Math.max(1, jetCount)) * 0.9);
  }

  const yScale = scaleLinear()
    .domain([yDomain[0] || 0, yDomain[1] || 1])
    .range([height - margin.bottom, margin.top])
    .nice();

  return { mode, xBand, xLinear, yScale, slotWidth };
}
