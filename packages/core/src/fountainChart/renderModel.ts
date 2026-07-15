// Renderer-agnostic FountainChart model: one jet per data item, resolved to
// pixel-space paths for the chosen silhouette style, plus the optional trend
// line through the apexes. Built once and consumed identically by the SVG and
// canvas renderers (the colour contract reaches canvas via the SVG probe).
//
// Both styles are graduated-opacity froth columns (dense base -> wispy crown):
//  - style "jet"   (default): a tall, narrow column that frays into a feathery,
//                  wind-drifting crown - the real Jet d'Eau. No mist skirt / droplets.
//  - style "plume": an upright symmetric column with a soft mist skirt + droplet arcs.
import { sanitizeForClassName } from "../math/sanitize";
import { isPredicted } from "../math/provenance";
import { parseXValue } from "../lineChart/lineUtils";
import {
  buildJetPath,
  buildFrothSlices,
  buildDropletPaths,
  buildMistPath,
  jetApexCenter,
  type JetGeometryInput,
} from "./geometry";
import type { FountainScales } from "./scales";
import type { FountainColorResolver } from "./colors";
import type { FountainDataItem, XaxisDataType } from "../types";

export type FountainStyle = "jet" | "plume";

export interface FountainJetModel {
  /** the source data item (for the tooltip formatter) */
  item: FountainDataItem;
  label: string;
  safe: string;
  color: string;
  value: number;
  spread: number;
  predicted: boolean;
  dimmed: boolean;
  style: FountainStyle;
  /** pixel geometry, for tooltips / hit region */
  xCenter: number;
  yApex: number;
  yBase: number;
  /** axis-aligned hit region (canvas mode), covering the full painted silhouette */
  hit: { left: number; right: number; top: number; bottom: number };

  bloomHalf: number;
  frothLayers: number;
  /** graduated-opacity froth slices (base..crown) - the column itself */
  slicePaths: string[];
  sliceOpacities: number[];
  /** full silhouette, for canvas hit-test + the predicted dashed outline */
  outlinePath: string;
  /** ballistic droplet arcs (plume only; [] for jet) */
  dropletPaths: string[];
  /** mist skirt (plume only; null for jet) */
  mistPath: string | null;
}

export interface FountainRenderModel {
  jets: FountainJetModel[];
  trendLinePath: string | null;
  /** labels whose spread was clipped to the slot width */
  clippedLabels: string[];
}

export interface BuildFountainModelOptions {
  style: FountainStyle;
  frothLayers: number;
  bloomExponent: number;
  stemFraction: number;
  showDroplets: boolean;
  showMist: boolean;
  showTrendLine: boolean;
  highlightItems: string[];
  maxDensity: number;
}

const SOLID_BASE_OPACITY = 0.18;
const PREDICTED_BASE_OPACITY = 0.1;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function buildFountainRenderModel(
  items: FountainDataItem[],
  mode: "snapshot" | "trend",
  temporalType: XaxisDataType | null,
  scales: FountainScales,
  colors: FountainColorResolver,
  o: BuildFountainModelOptions,
): FountainRenderModel {
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;
  // Pixels-per-value-unit is the scale slope; constant, and correct even when the
  // y-domain floor is non-zero (so spread maps right regardless of the floor).
  const pxPerUnit = Math.abs(scales.yScale(1) - scales.yScale(0));
  // Anchor every jet to the PLOT BOTTOM, not yScale(0) (which lands off-plot when
  // a custom yAxisDomain has a non-zero floor).
  const yBase = scales.yScale.range()[0];

  // x centre per item (needed up front so trend can size slots from the real gaps).
  const xCenters = items.map((item) => {
    if (mode === "trend" && scales.xLinear && temporalType) {
      const parsed = parseXValue(item.date as number | string, temporalType);
      return (scales.xLinear as (x: number | Date) => number)(parsed);
    }
    if (scales.xBand) {
      return (scales.xBand(item.label) ?? scales.xBand.range()[0]) + scales.xBand.bandwidth() / 2;
    }
    return 0;
  });

  // Slot width: band bandwidth in snapshot; the MINIMUM adjacent pixel gap in
  // trend (so clustered/uneven dates don't collide, not the average spacing).
  let slotWidth = scales.slotWidth;
  if (mode === "trend" && xCenters.length >= 2) {
    const sorted = [...xCenters].filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
    let minGap = Infinity;
    for (let i = 1; i < sorted.length; i++) minGap = Math.min(minGap, sorted[i] - sorted[i - 1]);
    if (Number.isFinite(minGap) && minGap > 0) slotWidth = Math.max(8, minGap * 0.9);
  }
  const slotHalf = slotWidth * 0.45;

  const jets: FountainJetModel[] = [];
  const clippedLabels: string[] = [];

  items.forEach((item, index) => {
    const value = Number(item.value);
    const spread = Math.abs(Number(item.spread));
    const safeValue = Number.isFinite(value) ? value : 0;
    const safeSpread = Number.isFinite(spread) ? spread : 0;

    const xCenter = xCenters[index];
    const yApex = scales.yScale(safeValue);
    const stemHalf = Math.max(2, slotWidth * o.stemFraction);
    const spreadPx = safeSpread * pxPerUnit;
    // lean is a sign-only flag: absent = no data (jet keeps its decorative wind),
    // 0 = truly upright, +/-x = the spread hangs on that side.
    const lean =
      item.lean === undefined || item.lean === null || !Number.isFinite(Number(item.lean))
        ? null
        : clamp(Number(item.lean), -1, 1);
    const predicted = isPredicted({
      date: item.date ?? 0,
      certainty: item.certainty,
      predicted: item.predicted,
    });
    const dimmed = anyHighlight && !highlightSet.has(item.label);

    const densityNorm =
      o.maxDensity > 0 && Number.isFinite(Number(item.density))
        ? clamp(Number(item.density) / o.maxDensity, 0, 1)
        : -1;

    const base: Omit<
      FountainJetModel,
      | "bloomHalf"
      | "frothLayers"
      | "slicePaths"
      | "sliceOpacities"
      | "outlinePath"
      | "dropletPaths"
      | "mistPath"
      | "hit"
    > = {
      item,
      label: item.label,
      safe: sanitizeForClassName(item.label),
      color: colors.getColor(item.label),
      value: safeValue,
      spread: safeSpread,
      predicted,
      dimmed,
      style: o.style,
      xCenter,
      yApex,
      yBase,
    };

    const isJet = o.style === "jet";
    const H = yBase - yApex;

    // Bloom: how wide the crown frays. The jet stays narrow (capped to a fraction
    // of its height) so it reads as a tall column; the plume may bloom to the slot.
    if (spreadPx > slotHalf) clippedLabels.push(item.label);
    let bloomHalf = clamp(Math.max(spreadPx, 4), stemHalf, slotHalf);
    if (isJet) bloomHalf = Math.min(bloomHalf, Math.max(stemHalf + 4, H * 0.28));

    let frothLayers =
      densityNorm >= 0 ? Math.round(4 + densityNorm * (o.frothLayers - 4)) : o.frothLayers;
    if (predicted) frothLayers = Math.max(3, Math.round(frothLayers * 0.7));
    frothLayers = clamp(frothLayers, 1, 20);

    // Crown drift: the jet leans into the wind strongly (a fraction of its height),
    // the plume only nudges. A jet with NO lean drifts gently (decorative wind);
    // an explicit lean of 0 stands the jet upright.
    const crownDrift = isJet
      ? (lean === null ? 0.2 : lean) * H * 0.16
      : (lean ?? 0) * bloomHalf * 0.3;

    const geom: JetGeometryInput = {
      xCenter,
      yApex,
      yBase,
      stemHalf,
      bloomHalf,
      crownDrift,
      bloomExponent: o.bloomExponent,
    };
    const baseOpacity = predicted ? PREDICTED_BASE_OPACITY : SOLID_BASE_OPACITY;
    const slices = buildFrothSlices(geom, frothLayers, baseOpacity);
    const dimFactor = dimmed ? 0.3 : 1;
    const apexX = jetApexCenter(geom);

    // Plume-only flourishes; the jet is just the fraying column.
    const dropletCount =
      !isJet && o.showDroplets ? (densityNorm >= 0 ? Math.round(3 + densityNorm * 6) : 6) : 0;
    const mistPath = !isJet && o.showMist ? buildMistPath(geom, slotHalf) : null;
    const mistHalf = mistPath
      ? Math.min(Math.max(bloomHalf * 1.2, stemHalf * 2.5), slotHalf)
      : bloomHalf;
    const hitHalf = Math.max(bloomHalf, mistHalf);
    const driftReach = Math.abs(apexX - xCenter);

    jets.push({
      ...base,
      bloomHalf,
      frothLayers,
      slicePaths: slices.map((s) => s.path),
      sliceOpacities: slices.map((s) => s.opacity * dimFactor),
      outlinePath: buildJetPath(geom),
      dropletPaths: buildDropletPaths(geom, dropletCount),
      mistPath,
      hit: {
        left: Math.min(xCenter, apexX) - hitHalf - driftReach - 2,
        right: Math.max(xCenter, apexX) + hitHalf + driftReach + 2,
        top: yApex - 16,
        bottom: yBase,
      },
    });
  });

  // Trend line through the apexes (sorted by x).
  let trendLinePath: string | null = null;
  if (mode === "trend" && o.showTrendLine && jets.length >= 2) {
    const pts = jets
      .map((j) => ({ x: j.xCenter, y: j.yApex }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      .sort((a, b) => a.x - b.x);
    if (pts.length >= 2) {
      const r = (n: number): number => Math.round(n * 100) / 100;
      trendLinePath =
        `M${r(pts[0].x)},${r(pts[0].y)}` +
        pts
          .slice(1)
          .map((p) => ` L${r(p.x)},${r(p.y)}`)
          .join("");
    }
  }

  return { jets, trendLinePath, clippedLabels };
}
