// Ported from michi-vz src/components/hooks/gapChart/useGapChartData.ts (the
// React useMemo shells dropped - pure functions).
import type { GapDataItem, Filter } from "../types";

export interface ProcessedGapData {
  // every item has `difference` resolved (value1 - value2 when not provided)
  processedDataSet: GapDataItem[];
  yAxisDomain: string[];
  xAxisDomain: [number, number];
  allLabels: string[];
}

function withDifference(dataSet: GapDataItem[]): GapDataItem[] {
  return dataSet.map((item) => ({
    ...item,
    difference: item.difference != null ? item.difference : item.value1 - item.value2,
  }));
}

function sortByCriteria(data: GapDataItem[], filter: Filter): GapDataItem[] {
  return data.slice().sort((a, b) => {
    const aValue = a[filter.criteria as keyof GapDataItem] as number;
    const bValue = b[filter.criteria as keyof GapDataItem] as number;
    return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
  });
}

function normalizedNumberTicks(tickValues?: Array<number | Date>): number[] {
  // `tickValues` is a public consumer input. Do not trust it blindly for the
  // chart domain: bad values (`NaN`, `Infinity`), duplicate ticks, or reversed
  // order can otherwise create a poisoned x-scale and make marks disappear.
  return Array.from(
    new Set(
      (tickValues || [])
        .map((v) => (v instanceof Date ? v.valueOf() : v))
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v)),
    ),
  ).sort((a, b) => a - b);
}

function dataDomainWithPadding(values: number[]): [number, number] {
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);

  if (dataMin === 0 && dataMax === 0) {
    return [-1, 1];
  }

  // Preserve the legacy zero-baseline for ordinary all-positive GapCharts whose
  // marks do not sit at zero, but add left padding when zero is an actual mark.
  // ATO percentage Snapshot always draws one endpoint at 0; without padding the
  // baseline circle/square is centred on the axis edge and visually overflows it.
  if (dataMin >= 0) {
    const max = dataMax * 1.1;
    const min = dataMin === 0 ? -Math.abs(dataMax) * 0.1 : 0;
    return [min, max];
  }

  // Same for all-negative data: keep the zero baseline unless zero is an actual
  // endpoint, then add enough right-side padding for the marker geometry.
  if (dataMax <= 0) {
    const min = dataMin * 1.1;
    const max = dataMax === 0 ? Math.abs(dataMin) * 0.1 : 0;
    return [min, max];
  }

  // Mixed-sign percentage changes can be very asymmetric (e.g. -100% and +1%).
  // Endpoint-based 10% padding gives the tiny side sub-pixel visual room, so use
  // the full range instead to keep bars/markers inside the visible axis.
  const padding = (dataMax - dataMin) * 0.1;
  return [dataMin - padding, dataMax + padding];
}

export function processGapChartData(
  dataSet: GapDataItem[],
  filter: Filter | undefined,
  disabledItems: string[],
  tickValues?: Array<number | Date>,
): ProcessedGapData {
  const dataWithDifference = withDifference(dataSet);

  let processedDataSet: GapDataItem[];
  let allLabels: string[];

  if (!filter) {
    processedDataSet = dataWithDifference.filter((d) => !disabledItems.includes(d.label));
    allLabels = dataWithDifference.map((d) => d.label);
  } else {
    const dateFiltered = filter.date
      ? dataWithDifference.filter((d) => d.date === filter.date)
      : dataWithDifference;
    const sorted = sortByCriteria(dateFiltered, filter);
    processedDataSet = sorted
      .slice(0, filter.limit)
      .filter((d) => !disabledItems.includes(d.label));
    // allLabels keeps disabled items too, for stable colour generation.
    allLabels = sorted.slice(0, filter.limit).map((d) => d.label);
  }

  const yAxisDomain = processedDataSet.map((d) => d.label);

  let xAxisDomain: [number, number];
  if (processedDataSet.length === 0) {
    xAxisDomain = [0, 0];
  } else {
    const normalizedTicks = normalizedNumberTicks(tickValues);
    if (normalizedTicks.length > 1) {
      // Explicit ticks intentionally define the visible numeric range, but only
      // after normalization proves they contain at least two distinct values.
      xAxisDomain = [normalizedTicks[0], normalizedTicks[normalizedTicks.length - 1]];
    } else {
      // Degenerate/invalid explicit ticks are ignored. Falling back to finite
      // data values keeps the library resilient to a buggy consumer tick helper.
      const allValues = processedDataSet
        .flatMap((d) => [d.value1, d.value2])
        .filter((value) => Number.isFinite(value));
      if (allValues.length === 0) {
        xAxisDomain = [0, 0];
        return { processedDataSet, yAxisDomain, xAxisDomain, allLabels };
      }
      xAxisDomain = dataDomainWithPadding(allValues);
    }
  }

  return { processedDataSet, yAxisDomain, xAxisDomain, allLabels };
}
