import { mountRadarChart } from "@michi-vz/core";
import type { RadarChartProps, ChartInstance } from "@michi-vz/core";

export type { RadarChartProps } from "@michi-vz/core";

export interface RadarChartAction {
  update(props: RadarChartProps): void;
  destroy(): void;
  getContext: ChartInstance<RadarChartProps>["getContext"];
}

export function radarChart(node: HTMLElement, props: RadarChartProps): RadarChartAction {
  const chart = mountRadarChart(node, props);
  return {
    update: (next: RadarChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}
