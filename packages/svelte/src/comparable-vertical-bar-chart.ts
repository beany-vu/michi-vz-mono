import { mountComparableVerticalBarChart } from "@michi-vz/core";
import type { ComparableVerticalBarChartProps, ChartInstance } from "@michi-vz/core";

export type { ComparableVerticalBarChartProps } from "@michi-vz/core";

export interface ComparableVerticalBarChartAction {
  update(props: ComparableVerticalBarChartProps): void;
  destroy(): void;
  getContext: ChartInstance<ComparableVerticalBarChartProps>["getContext"];
}

export function comparableVerticalBarChart(
  node: HTMLElement,
  props: ComparableVerticalBarChartProps,
): ComparableVerticalBarChartAction {
  const chart = mountComparableVerticalBarChart(node, props);
  return {
    update: (next: ComparableVerticalBarChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
