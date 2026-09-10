import { mountBubbleChart } from "@michi-vz/core";
import type { BubbleChartProps, ChartInstance } from "@michi-vz/core";

export type { BubbleChartProps } from "@michi-vz/core";

export interface BubbleChartAction {
  update(props: BubbleChartProps): void;
  destroy(): void;
  getContext: ChartInstance<BubbleChartProps>["getContext"];
}

export function bubbleChart(node: HTMLElement, props: BubbleChartProps): BubbleChartAction {
  const chart = mountBubbleChart(node, props);
  return {
    update: (next: BubbleChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
