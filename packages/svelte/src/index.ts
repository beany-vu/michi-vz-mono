// Svelte wrappers as actions (plain TS — no .svelte compiler needed to build the
// library). Usage:  <div use:gapChart={props}></div> / <div use:lineChart={props}></div>
import {
  mountGapChart,
  mountLineChart,
  mountFanChart,
  mountAreaChart,
  mountScatterChart,
  mountVerticalStackBarChart,
  mountComparableHorizontalBarChart,
  mountDualHorizontalBarChart,
  mountBarBellChart,
  mountRangeChart,
  mountRibbonChart,
  mountRadarChart,
} from "@michi-vz/core";
import type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  ChartInstance,
} from "@michi-vz/core";

export type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  ChartContext,
} from "@michi-vz/core";

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

export interface LineChartAction {
  update(props: LineChartProps): void;
  destroy(): void;
  getContext: ChartInstance<LineChartProps>["getContext"];
}

export function lineChart(node: HTMLElement, props: LineChartProps): LineChartAction {
  const chart = mountLineChart(node, props);
  return {
    update: (next: LineChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

export interface FanChartAction {
  update(props: FanChartProps): void;
  destroy(): void;
  getContext: ChartInstance<FanChartProps>["getContext"];
}

export function fanChart(node: HTMLElement, props: FanChartProps): FanChartAction {
  const chart = mountFanChart(node, props);
  return {
    update: (next: FanChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

export interface AreaChartAction {
  update(props: AreaChartProps): void;
  destroy(): void;
  getContext: ChartInstance<AreaChartProps>["getContext"];
}

export function areaChart(node: HTMLElement, props: AreaChartProps): AreaChartAction {
  const chart = mountAreaChart(node, props);
  return {
    update: (next: AreaChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

export interface ScatterChartAction {
  update(props: ScatterChartProps): void;
  destroy(): void;
  getContext: ChartInstance<ScatterChartProps>["getContext"];
}

export function scatterChart(node: HTMLElement, props: ScatterChartProps): ScatterChartAction {
  const chart = mountScatterChart(node, props);
  return {
    update: (next: ScatterChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

export interface VerticalStackBarChartAction {
  update(props: VerticalStackBarChartProps): void;
  destroy(): void;
  getContext: ChartInstance<VerticalStackBarChartProps>["getContext"];
}

export function verticalStackBarChart(
  node: HTMLElement,
  props: VerticalStackBarChartProps
): VerticalStackBarChartAction {
  const chart = mountVerticalStackBarChart(node, props);
  return {
    update: (next: VerticalStackBarChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

export interface ComparableHorizontalBarChartAction {
  update(props: ComparableBarChartProps): void;
  destroy(): void;
  getContext: ChartInstance<ComparableBarChartProps>["getContext"];
}

export function comparableHorizontalBarChart(
  node: HTMLElement,
  props: ComparableBarChartProps
): ComparableHorizontalBarChartAction {
  const chart = mountComparableHorizontalBarChart(node, props);
  return {
    update: (next: ComparableBarChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

export interface DualHorizontalBarChartAction {
  update(props: DualBarChartProps): void;
  destroy(): void;
  getContext: ChartInstance<DualBarChartProps>["getContext"];
}

export function dualHorizontalBarChart(
  node: HTMLElement,
  props: DualBarChartProps
): DualHorizontalBarChartAction {
  const chart = mountDualHorizontalBarChart(node, props);
  return {
    update: (next: DualBarChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

export interface BarBellChartAction {
  update(props: BarBellChartProps): void;
  destroy(): void;
  getContext: ChartInstance<BarBellChartProps>["getContext"];
}

export function barBellChart(node: HTMLElement, props: BarBellChartProps): BarBellChartAction {
  const chart = mountBarBellChart(node, props);
  return {
    update: (next: BarBellChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

export interface RangeChartAction {
  update(props: RangeChartProps): void;
  destroy(): void;
  getContext: ChartInstance<RangeChartProps>["getContext"];
}

export function rangeChart(node: HTMLElement, props: RangeChartProps): RangeChartAction {
  const chart = mountRangeChart(node, props);
  return {
    update: (next: RangeChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

export interface RibbonChartAction {
  update(props: RibbonChartProps): void;
  destroy(): void;
  getContext: ChartInstance<RibbonChartProps>["getContext"];
}

export function ribbonChart(node: HTMLElement, props: RibbonChartProps): RibbonChartAction {
  const chart = mountRibbonChart(node, props);
  return {
    update: (next: RibbonChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

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
