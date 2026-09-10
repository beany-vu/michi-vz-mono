import { mountFountainChart } from "@michi-vz/core";
import type { FountainChartProps, ChartInstance } from "@michi-vz/core";

export type { FountainChartProps } from "@michi-vz/core";

export interface FountainChartAction {
  update(props: FountainChartProps): void;
  destroy(): void;
  getContext: ChartInstance<FountainChartProps>["getContext"];
}

export function fountainChart(node: HTMLElement, props: FountainChartProps): FountainChartAction {
  const chart = mountFountainChart(node, props);
  return {
    update: (next: FountainChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
