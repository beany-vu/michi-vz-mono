import { mountGaugeChart } from "@michi-vz/core";
import type { GaugeChartProps, ChartInstance } from "@michi-vz/core";

export type { GaugeChartProps } from "@michi-vz/core";

export interface GaugeChartAction {
  update(props: GaugeChartProps): void;
  destroy(): void;
  getContext: ChartInstance<GaugeChartProps>["getContext"];
}

export function gaugeChart(node: HTMLElement, props: GaugeChartProps): GaugeChartAction {
  const chart = mountGaugeChart(node, props);
  return {
    update: (next: GaugeChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
