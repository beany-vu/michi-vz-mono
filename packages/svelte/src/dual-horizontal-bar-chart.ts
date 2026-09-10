import { mountDualHorizontalBarChart } from "@michi-vz/core";
import type { DualBarChartProps, ChartInstance } from "@michi-vz/core";

export type { DualBarChartProps } from "@michi-vz/core";

export interface DualHorizontalBarChartAction {
  update(props: DualBarChartProps): void;
  destroy(): void;
  getContext: ChartInstance<DualBarChartProps>["getContext"];
}

export function dualHorizontalBarChart(
  node: HTMLElement,
  props: DualBarChartProps,
): DualHorizontalBarChartAction {
  const chart = mountDualHorizontalBarChart(node, props);
  return {
    update: (next: DualBarChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
