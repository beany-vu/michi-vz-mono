// Svelte wrapper as an action (plain TS — no .svelte compiler needed to build
// the library). Usage:  <div use:gapChart={props}></div>
import { mountGapChart } from "@michi-vz/core";
import type { GapChartProps, ChartInstance } from "@michi-vz/core";

export type { GapChartProps, ChartContext } from "@michi-vz/core";

export interface GapChartAction {
  update(props: GapChartProps): void;
  destroy(): void;
  getContext: ChartInstance<GapChartProps>["getContext"];
}

export function gapChart(node: HTMLElement, props: GapChartProps): GapChartAction {
  const chart = mountGapChart(node, props);
  return {
    update: (next: GapChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
