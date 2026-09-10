import { mountRangeChart } from "@michi-vz/core";
import type { RangeChartProps, ChartInstance } from "@michi-vz/core";

export type { RangeChartProps } from "@michi-vz/core";

export interface RangeChartAction {
  update(props: RangeChartProps): void;
  destroy(): void;
  getContext: ChartInstance<RangeChartProps>["getContext"];
}

export function rangeChart(node: HTMLElement, props: RangeChartProps): RangeChartAction {
  const chart = mountRangeChart(node, props);
  return {
    update: (next: RangeChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
