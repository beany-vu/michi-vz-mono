import { mountRadialTreeChart } from "@michi-vz/core";
import type { RadialTreeChartProps, ChartInstance } from "@michi-vz/core";

export type { RadialTreeChartProps } from "@michi-vz/core";

export interface RadialTreeChartAction {
  update(props: RadialTreeChartProps): void;
  destroy(): void;
  getContext: ChartInstance<RadialTreeChartProps>["getContext"];
}

export function radialTreeChart(
  node: HTMLElement,
  props: RadialTreeChartProps,
): RadialTreeChartAction {
  const chart = mountRadialTreeChart(node, props);
  return {
    update: (next: RadialTreeChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
