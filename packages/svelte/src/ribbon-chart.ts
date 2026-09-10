import { mountRibbonChart } from "@michi-vz/core";
import type { RibbonChartProps, ChartInstance } from "@michi-vz/core";

export type { RibbonChartProps } from "@michi-vz/core";

export interface RibbonChartAction {
  update(props: RibbonChartProps): void;
  destroy(): void;
  getContext: ChartInstance<RibbonChartProps>["getContext"];
}

export function ribbonChart(node: HTMLElement, props: RibbonChartProps): RibbonChartAction {
  const chart = mountRibbonChart(node, props);
  return {
    update: (next: RibbonChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
