import { mountScatterChart } from "@michi-vz/core";
import type { ScatterChartProps, ChartInstance } from "@michi-vz/core";

export type { ScatterChartProps } from "@michi-vz/core";

export interface ScatterChartAction {
  update(props: ScatterChartProps): void;
  destroy(): void;
  getContext: ChartInstance<ScatterChartProps>["getContext"];
}

export function scatterChart(node: HTMLElement, props: ScatterChartProps): ScatterChartAction {
  const chart = mountScatterChart(node, props);
  return {
    update: (next: ScatterChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
