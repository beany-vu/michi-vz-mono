import { mountChoroplethMapChart } from "@michi-vz/core";
import type { ChoroplethMapChartProps, ChartInstance } from "@michi-vz/core";

export type { ChoroplethMapChartProps } from "@michi-vz/core";

export interface ChoroplethMapChartAction {
  update(props: ChoroplethMapChartProps): void;
  destroy(): void;
  getContext: ChartInstance<ChoroplethMapChartProps>["getContext"];
}

export function choroplethMapChart(
  node: HTMLElement,
  props: ChoroplethMapChartProps,
): ChoroplethMapChartAction {
  const chart = mountChoroplethMapChart(node, props);
  return {
    update: (next: ChoroplethMapChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
