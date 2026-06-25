// Ported from michi-vz src/components/hooks/gapChart/useGapChartData.ts (the
// React useMemo shells dropped — pure functions).
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

export function processGapChartData(
  dataSet: GapDataItem[],
  filter: Filter | undefined,
  disabledItems: string[],
  tickValues?: Array<number | Date>
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
    processedDataSet = sorted.slice(0, filter.limit).filter((d) => !disabledItems.includes(d.label));
    // allLabels keeps disabled items too, for stable colour generation.
    allLabels = sorted.slice(0, filter.limit).map((d) => d.label);
  }

  const yAxisDomain = processedDataSet.map((d) => d.label);

  let xAxisDomain: [number, number];
  if (processedDataSet.length === 0) {
    xAxisDomain = [0, 0];
  } else if (
    tickValues &&
    tickValues.length > 1 &&
    typeof tickValues[0] === "number" &&
    typeof tickValues[tickValues.length - 1] === "number"
  ) {
    xAxisDomain = [tickValues[0] as number, tickValues[tickValues.length - 1] as number];
  } else {
    const allValues = processedDataSet.flatMap((d) => [d.value1, d.value2]);
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const min = dataMin < 0 ? dataMin * 1.1 : 0;
    const max = dataMax * 1.1;
    xAxisDomain = [min, max];
  }

  return { processedDataSet, yAxisDomain, xAxisDomain, allLabels };
}
