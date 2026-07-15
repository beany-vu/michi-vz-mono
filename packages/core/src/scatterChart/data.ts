// ScatterPlot data pipeline: exclude disabled labels, optional top-N filter
// (criteria x|y|d), and compute x/y/size domains. Pure.
import { parseXValue } from "../lineChart/lineUtils";
import type { Filter, ScatterDataPoint, XaxisDataType } from "../types";

export interface ProcessScatterOptions {
  disabledItems?: string[];
  filter?: Filter;
  xAxisDataType: XaxisDataType;
  xAxisDomain?: [number, number] | string[];
  yAxisDomain?: [number, number];
}

export interface ProcessedScatter {
  points: ScatterDataPoint[];
  xAxisDomain: [number, number] | string[];
  yAxisDomain: [number, number];
  dDomain: [number, number];
}

export function processScatterData(
  dataSet: ScatterDataPoint[],
  opts: ProcessScatterOptions,
): ProcessedScatter {
  const disabled = new Set(opts.disabledItems ?? []);
  let points = dataSet.filter((p) => !disabled.has(p.label));

  if (opts.filter) {
    const { criteria, sortingDir, limit, date } = opts.filter;
    const pick = (p: ScatterDataPoint): number =>
      criteria === "y" ? p.y : criteria === "d" ? (p.d ?? 0) : p.x;
    let arr = points;
    if (date !== undefined && date !== "") arr = arr.filter((p) => String(p.date) === String(date));
    const dir = sortingDir === "asc" ? 1 : -1;
    points = [...arr].sort((a, b) => dir * (pick(a) - pick(b))).slice(0, limit);
  }

  // Band (categorical) x: the domain is the ordered unique category labels of the
  // visible points - mirroring legacy ScatterPlotChart (scaleBand domain = dataSet
  // labels). The numeric `x` field is ignored for placement; marks are positioned by
  // `label` (see renderModel). y/size domains are still numeric.
  if (opts.xAxisDataType === "band") {
    const bandDomain: string[] = [];
    const seenLabels = new Set<string>();
    for (const p of points) {
      if (!seenLabels.has(p.label)) {
        seenLabels.add(p.label);
        bandDomain.push(p.label);
      }
    }
    let yhiB = -Infinity;
    let dloB = Infinity;
    let dhiB = -Infinity;
    for (const p of points) {
      if (p.y > yhiB) yhiB = p.y;
      const d = p.d ?? 0;
      if (d < dloB) dloB = d;
      if (d > dhiB) dhiB = d;
    }
    if (!Number.isFinite(yhiB)) yhiB = 1;
    if (!Number.isFinite(dloB)) {
      dloB = 0;
      dhiB = 1;
    }
    const dDomainB: [number, number] = dloB === dhiB ? [0, dhiB || 1] : [dloB, dhiB];
    return {
      points,
      xAxisDomain: bandDomain,
      yAxisDomain: opts.yAxisDomain ?? [0, yhiB],
      dDomain: dDomainB,
    };
  }

  // x domain: number -> [0, maxX]; date -> [minTs, maxTs].
  let xlo = opts.xAxisDataType === "number" ? 0 : Infinity;
  let xhi = -Infinity;
  for (const p of points) {
    const v = parseXValue(p.x, opts.xAxisDataType);
    const n = typeof v === "number" ? v : v.getTime();
    if (Number.isNaN(n)) continue;
    if (n < xlo) xlo = n;
    if (n > xhi) xhi = n;
  }
  if (!Number.isFinite(xlo)) xlo = 0;
  if (!Number.isFinite(xhi)) xhi = 1;

  let yhi = -Infinity;
  let dlo = Infinity;
  let dhi = -Infinity;
  for (const p of points) {
    if (p.y > yhi) yhi = p.y;
    const d = p.d ?? 0;
    if (d < dlo) dlo = d;
    if (d > dhi) dhi = d;
  }
  if (!Number.isFinite(yhi)) yhi = 1;
  if (!Number.isFinite(dlo)) {
    dlo = 0;
    dhi = 1;
  }
  // Avoid a zero-width size domain (single d value).
  const dDomain: [number, number] = dlo === dhi ? [0, dhi || 1] : [dlo, dhi];

  return {
    points,
    xAxisDomain: opts.xAxisDomain ?? [xlo, xhi],
    yAxisDomain: opts.yAxisDomain ?? [0, yhi],
    dDomain,
  };
}
