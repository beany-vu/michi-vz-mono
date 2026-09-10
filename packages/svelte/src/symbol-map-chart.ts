import { mountSymbolMapChart } from "@michi-vz/core";
import type { SymbolMapChartProps, ChartInstance } from "@michi-vz/core";

export type { SymbolMapChartProps } from "@michi-vz/core";

export interface SymbolMapChartAction {
  update(props: SymbolMapChartProps): void;
  destroy(): void;
  getContext: ChartInstance<SymbolMapChartProps>["getContext"];
}

export function symbolMapChart(
  node: HTMLElement,
  props: SymbolMapChartProps,
): SymbolMapChartAction {
  const chart = mountSymbolMapChart(node, props);
  return {
    update: (next: SymbolMapChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
