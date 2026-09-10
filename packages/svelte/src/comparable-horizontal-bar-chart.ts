import { mountComparableHorizontalBarChart } from "@michi-vz/core";
import type { ComparableBarChartProps, ChartInstance } from "@michi-vz/core";

export type { ComparableBarChartProps } from "@michi-vz/core";

export interface ComparableHorizontalBarChartAction {
  update(props: ComparableBarChartProps): void;
  destroy(): void;
  getContext: ChartInstance<ComparableBarChartProps>["getContext"];
}

export function comparableHorizontalBarChart(
  node: HTMLElement,
  props: ComparableBarChartProps,
): ComparableHorizontalBarChartAction {
  const chart = mountComparableHorizontalBarChart(node, props);
  return {
    update: (next: ComparableBarChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
