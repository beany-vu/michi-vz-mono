// Manual bottom-up pixel-space stacking (NOT d3.stack), ported verbatim from the
// legacy VerticalStackBarChart so the documented flooring + the hasOwnProperty
// marker guard are preserved exactly. Pure (no DOM). HARD RULE: the guard lives
// here and ONLY here; the canvas renderer must not re-implement it.
import type { StackRectData, VerticalStackBarDataSet } from "../types";
import type { HorizontalStackScales, StackScales } from "./scales";
import type { StackColorResolver } from "./colors";

export interface PrepareStackOptions {
  keysOrder: "topToBottom" | "bottomToTop";
  minBarWidth: number;
  minBarHeight: number;
  minBarHeightZero: number;
  missingDataMarker?: { height: number };
  /** DataSet groups (by seriesKey) to drop before drawing; the remaining (visible)
   * groups split the band, so disabling a series WIDENS the rest (legacy parity). */
  disabledItems?: string[];
}

export interface PreparedStack {
  stackedData: Record<string, StackRectData[]>;
  groupWidth: number;
}

// Codes may be numeric (e.g. thd goods sector codes) — coerce, don't drop them.
const codeOf = (v: unknown): string | undefined =>
  typeof v === "string" || typeof v === "number" ? String(v) : undefined;

export function prepareStackedData(
  dataSet: VerticalStackBarDataSet[],
  effectiveKeys: string[],
  scales: StackScales,
  colors: StackColorResolver,
  o: PrepareStackOptions,
): PreparedStack {
  const stackedData: Record<string, StackRectData[]> = {};
  for (const k of effectiveKeys) stackedData[k] = [];

  // Drop disabled DataSet groups so the visible groups split the band between them
  // (a disabled series widens the rest), mirroring the legacy chart.
  const disabled = new Set(o.disabledItems ?? []);
  const visibleDataSet = dataSet.filter((ds) => !disabled.has(ds.seriesKey ?? ""));

  const bandwidth = scales.xScale.bandwidth();
  const groupWidth = visibleDataSet.length > 0 ? bandwidth / visibleDataSet.length : bandwidth;

  // topToBottom: keys[0] renders at the TOP, so stack keys[last] first at the
  // bottom -> iterate reversed. bottomToTop anchors keys[0] at the bottom.
  const orderedKeys = o.keysOrder === "bottomToTop" ? effectiveKeys : [...effectiveKeys].reverse();

  visibleDataSet.forEach((dataItem, groupIndex) => {
    for (const yearData of dataItem.series) {
      let y0 = 0;
      let pixelBottom = scales.yScale(0);
      const baseX = (scales.xScale(String(yearData.date)) ?? 0) + groupWidth * groupIndex + 2;
      const width = Math.max(groupWidth - 4, o.minBarWidth);

      for (const key of orderedKeys) {
        const value = yearData[key];
        const numericValue = typeof value === "string" ? parseFloat(value) : (value as number);
        const isMissingValue = value === undefined || value === null || Number.isNaN(numericValue);

        if (isMissingValue) {
          // Stub marker (opt-in via `missingDataMarker`): a thin bar on the zero
          // line that says "selected but no data here". y0 is intentionally left
          // untouched so the marker doesn't shift the stack height for any real
          // bars below/above it.
          //
          // hasOwnProperty guard: only emit a marker if the key is explicitly
          // present on this data point (with a null/NaN/undefined value). A key
          // that is simply absent from the data point means "this DataSet doesn't
          // own this key" - its bar belongs to a different DataSet's slot, not
          // this one, so emitting a marker here would paint a stub in every
          // group's slot for every other group's missing key.
          const isExplicitlyMissing = Object.prototype.hasOwnProperty.call(yearData, key);
          if (o.missingDataMarker && isExplicitlyMissing) {
            const markerHeight = o.missingDataMarker.height;
            stackedData[key].push({
              key,
              height: markerHeight,
              width,
              y: scales.yScale(0) - markerHeight,
              x: baseX,
              data: yearData,
              fill: colors.getColor(key),
              seriesKey: dataItem.seriesKey,
              seriesKeyAbbreviation: dataItem.seriesKeyAbbreviation,
              value: null,
              date: yearData.date,
              code: codeOf(yearData.code),
              isMissing: true,
            });
          }
          // Do NOT advance y0 / pixelBottom for a missing value.
          continue;
        }

        const y1 = y0 + numericValue;
        const rawHeight = scales.yScale(y0) - scales.yScale(y1);
        const itemHeight =
          numericValue !== 0 && rawHeight > 0
            ? Math.max(o.minBarHeight, rawHeight)
            : numericValue === 0
              ? o.minBarHeightZero
              : Math.max(0, rawHeight);
        const rectY = pixelBottom - itemHeight;

        stackedData[key].push({
          key,
          height: itemHeight,
          width,
          y: rectY,
          x: baseX,
          data: yearData,
          fill: colors.getColor(key),
          seriesKey: dataItem.seriesKey,
          seriesKeyAbbreviation: dataItem.seriesKeyAbbreviation,
          value: numericValue,
          date: yearData.date,
          code: codeOf(yearData.code),
        });

        y0 = y1;
        pixelBottom = rectY;
      }
    }
  });

  return { stackedData, groupWidth };
}

/**
 * layout="horizontal": the same stacking rules transposed - rows on a band
 * y-axis, segments growing rightward from x(0). The minBar* options keep their
 * ROLE, not their axis: `minBarHeight` is still the minimum size of a non-zero
 * segment along the VALUE axis (here: width), `minBarHeightZero` the size of a
 * zero-value segment, and `minBarWidth` the minimum band-side thickness (here:
 * row height). The hasOwnProperty missing-marker guard is shared verbatim.
 * keysOrder "topToBottom" (default) puts keys[0] nearest the axis (leftmost).
 */
export function prepareStackedDataHorizontal(
  dataSet: VerticalStackBarDataSet[],
  effectiveKeys: string[],
  scales: HorizontalStackScales,
  colors: StackColorResolver,
  o: PrepareStackOptions,
): PreparedStack {
  const stackedData: Record<string, StackRectData[]> = {};
  for (const k of effectiveKeys) stackedData[k] = [];

  const disabled = new Set(o.disabledItems ?? []);
  const visibleDataSet = dataSet.filter((ds) => !disabled.has(ds.seriesKey ?? ""));

  const bandwidth = scales.yScale.bandwidth();
  const groupHeight = visibleDataSet.length > 0 ? bandwidth / visibleDataSet.length : bandwidth;

  // Horizontal reads left-to-right, so "topToBottom" (keys[0] first) stacks
  // keys[0] against the axis; "bottomToTop" reverses (keys[0] outermost).
  const orderedKeys = o.keysOrder === "bottomToTop" ? [...effectiveKeys].reverse() : effectiveKeys;

  visibleDataSet.forEach((dataItem, groupIndex) => {
    for (const yearData of dataItem.series) {
      let v0 = 0;
      let pixelLeft = scales.xScale(0);
      const baseY = (scales.yScale(String(yearData.date)) ?? 0) + groupHeight * groupIndex + 2;
      const height = Math.max(groupHeight - 4, o.minBarWidth);

      for (const key of orderedKeys) {
        const value = yearData[key];
        const numericValue = typeof value === "string" ? parseFloat(value) : (value as number);
        const isMissingValue = value === undefined || value === null || Number.isNaN(numericValue);

        if (isMissingValue) {
          const isExplicitlyMissing = Object.prototype.hasOwnProperty.call(yearData, key);
          if (o.missingDataMarker && isExplicitlyMissing) {
            const markerWidth = o.missingDataMarker.height;
            stackedData[key].push({
              key,
              height,
              width: markerWidth,
              y: baseY,
              x: scales.xScale(0),
              data: yearData,
              fill: colors.getColor(key),
              seriesKey: dataItem.seriesKey,
              seriesKeyAbbreviation: dataItem.seriesKeyAbbreviation,
              value: null,
              date: yearData.date,
              code: codeOf(yearData.code),
              isMissing: true,
            });
          }
          continue;
        }

        const v1 = v0 + numericValue;
        const rawWidth = scales.xScale(v1) - scales.xScale(v0);
        const itemWidth =
          numericValue !== 0 && rawWidth > 0
            ? Math.max(o.minBarHeight, rawWidth)
            : numericValue === 0
              ? o.minBarHeightZero
              : Math.max(0, rawWidth);

        stackedData[key].push({
          key,
          height,
          width: itemWidth,
          y: baseY,
          x: pixelLeft,
          data: yearData,
          fill: colors.getColor(key),
          seriesKey: dataItem.seriesKey,
          seriesKeyAbbreviation: dataItem.seriesKeyAbbreviation,
          value: numericValue,
          date: yearData.date,
          code: codeOf(yearData.code),
        });

        v0 = v1;
        pixelLeft = pixelLeft + itemWidth;
      }
    }
  });

  return { stackedData, groupWidth: groupHeight };
}
