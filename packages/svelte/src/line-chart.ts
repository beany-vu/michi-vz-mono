import { mountLineChart } from "@michi-vz/core";
import type { LineChartProps, ChartInstance } from "@michi-vz/core";

export type { LineChartProps } from "@michi-vz/core";

export interface LineChartAction {
  update(props: LineChartProps): void;
  destroy(): void;
  getContext: ChartInstance<LineChartProps>["getContext"];
}

export function lineChart(node: HTMLElement, props: LineChartProps): LineChartAction {
  const chart = mountLineChart(node, props);
  return {
    update: (next: LineChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
