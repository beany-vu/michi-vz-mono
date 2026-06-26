// Manual bottom-up pixel-space stacking (NOT d3.stack), ported verbatim from the
// legacy VerticalStackBarChart so the documented flooring + the hasOwnProperty
// marker guard are preserved exactly. Pure (no DOM). HARD RULE: the guard lives
// here and ONLY here; the canvas renderer must not re-implement it.
import type {
  StackRectData,
  VerticalStackBarDataSet,
} from "../types";
import type { StackScales } from "./scales";
import type { StackColorResolver } from "./colors";

export interface PrepareStackOptions {
  keysOrder: "topToBottom" | "bottomToTop";
  minBarWidth: number;
  minBarHeight: number;
  minBarHeightZero: number;
  missingDataMarker?: { height: number };
}

export interface PreparedStack {
  stackedData: Record<string, StackRectData[]>;
  groupWidth: number;
}

const codeOf = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

export function prepareStackedData(
  dataSet: VerticalStackBarDataSet[],
  effectiveKeys: string[],
  scales: StackScales,
  colors: StackColorResolver,
  o: PrepareStackOptions
): PreparedStack {
  const stackedData: Record<string, StackRectData[]> = {};
  for (const k of effectiveKeys) stackedData[k] = [];

  const bandwidth = scales.xScale.bandwidth();
  const groupWidth = dataSet.length > 0 ? bandwidth / dataSet.length : bandwidth;

  // topToBottom: keys[0] renders at the TOP, so stack keys[last] first at the
  // bottom -> iterate reversed. bottomToTop anchors keys[0] at the bottom.
  const orderedKeys =
    o.keysOrder === "bottomToTop" ? effectiveKeys : [...effectiveKeys].reverse();

  dataSet.forEach((dataItem, groupIndex) => {
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
          // own this key" — its bar belongs to a different DataSet's slot, not
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
