import { mountFanChart } from "@michi-vz/core";
import type { FanChartProps, ChartInstance } from "@michi-vz/core";

export type { FanChartProps } from "@michi-vz/core";

export interface FanChartAction {
  update(props: FanChartProps): void;
  destroy(): void;
  getContext: ChartInstance<FanChartProps>["getContext"];
}

export function fanChart(node: HTMLElement, props: FanChartProps): FanChartAction {
  const chart = mountFanChart(node, props);
  return {
    update: (next: FanChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
