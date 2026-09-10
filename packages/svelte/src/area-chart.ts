import { mountAreaChart } from "@michi-vz/core";
import type { AreaChartProps, ChartInstance } from "@michi-vz/core";

export type { AreaChartProps } from "@michi-vz/core";

export interface AreaChartAction {
  update(props: AreaChartProps): void;
  destroy(): void;
  getContext: ChartInstance<AreaChartProps>["getContext"];
}

export function areaChart(node: HTMLElement, props: AreaChartProps): AreaChartAction {
  const chart = mountAreaChart(node, props);
  return {
    update: (next: AreaChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
