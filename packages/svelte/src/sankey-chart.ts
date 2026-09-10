import { mountSankeyChart } from "@michi-vz/core";
import type { SankeyChartProps, ChartInstance } from "@michi-vz/core";

export type { SankeyChartProps } from "@michi-vz/core";

export interface SankeyChartAction {
  update(props: SankeyChartProps): void;
  destroy(): void;
  getContext: ChartInstance<SankeyChartProps>["getContext"];
}

export function sankeyChart(node: HTMLElement, props: SankeyChartProps): SankeyChartAction {
  const chart = mountSankeyChart(node, props);
  return {
    update: (next: SankeyChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
