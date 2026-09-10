import { mountPieChart } from "@michi-vz/core";
import type { PieChartProps, ChartInstance } from "@michi-vz/core";

export type { PieChartProps } from "@michi-vz/core";

export interface PieChartAction {
  update(props: PieChartProps): void;
  destroy(): void;
  getContext: ChartInstance<PieChartProps>["getContext"];
}

export function pieChart(node: HTMLElement, props: PieChartProps): PieChartAction {
  const chart = mountPieChart(node, props);
  return {
    update: (next: PieChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
