import { mountTreemapChart } from "@michi-vz/core";
import type { TreemapChartProps, ChartInstance } from "@michi-vz/core";

export type { TreemapChartProps } from "@michi-vz/core";

export interface TreemapChartAction {
  update(props: TreemapChartProps): void;
  destroy(): void;
  getContext: ChartInstance<TreemapChartProps>["getContext"];
}

export function treemapChart(node: HTMLElement, props: TreemapChartProps): TreemapChartAction {
  const chart = mountTreemapChart(node, props);
  return {
    update: (next: TreemapChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
