import { mountBarBellChart } from "@michi-vz/core";
import type { BarBellChartProps, ChartInstance } from "@michi-vz/core";

export type { BarBellChartProps } from "@michi-vz/core";

export interface BarBellChartAction {
  update(props: BarBellChartProps): void;
  destroy(): void;
  getContext: ChartInstance<BarBellChartProps>["getContext"];
}

export function barBellChart(node: HTMLElement, props: BarBellChartProps): BarBellChartAction {
  const chart = mountBarBellChart(node, props);
  return {
    update: (next: BarBellChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
