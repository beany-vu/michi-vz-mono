import { mountVerticalStackBarChart } from "@michi-vz/core";
import type { VerticalStackBarChartProps, ChartInstance } from "@michi-vz/core";

export type { VerticalStackBarChartProps } from "@michi-vz/core";

export interface VerticalStackBarChartAction {
  update(props: VerticalStackBarChartProps): void;
  destroy(): void;
  getContext: ChartInstance<VerticalStackBarChartProps>["getContext"];
}

export function verticalStackBarChart(
  node: HTMLElement,
  props: VerticalStackBarChartProps,
): VerticalStackBarChartAction {
  const chart = mountVerticalStackBarChart(node, props);
  return {
    update: (next: VerticalStackBarChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
