// Svelte wrappers as actions (plain TS - no .svelte compiler needed to build the
// library). Usage:  <div use:gapChart={props}></div> / <div use:lineChart={props}></div>
import {
  mountGapChart,
  mountLineChart,
  mountFanChart,
  mountAreaChart,
  mountScatterChart,
  mountVerticalStackBarChart,
  mountComparableHorizontalBarChart,
  mountComparableVerticalBarChart,
  mountDualHorizontalBarChart,
  mountBarBellChart,
  mountRangeChart,
  mountRibbonChart,
  mountRadarChart,
  mountTreemapChart,
  mountPieChart,
  mountBubbleChart,
  mountSankeyChart,
  mountFountainChart,
  mountChoroplethMapChart,
  mountSymbolMapChart,
  mountRadialTreeChart,
} from "@michi-vz/core";
import type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  ComparableVerticalBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  TreemapChartProps,
  PieChartProps,
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ChoroplethMapChartProps,
  SymbolMapChartProps,
  RadialTreeChartProps,
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
  ComparableVerticalBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  TreemapChartProps,
  PieChartProps,
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ChoroplethMapChartProps,
  SymbolMapChartProps,
  RadialTreeChartProps,
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
  props: VerticalStackBarChartProps,
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
  props: ComparableBarChartProps,
): ComparableHorizontalBarChartAction {
  const chart = mountComparableHorizontalBarChart(node, props);
  return {
    update: (next: ComparableBarChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

export interface ComparableVerticalBarChartAction {
  update(props: ComparableVerticalBarChartProps): void;
  destroy(): void;
  getContext: ChartInstance<ComparableVerticalBarChartProps>["getContext"];
}

export function comparableVerticalBarChart(
  node: HTMLElement,
  props: ComparableVerticalBarChartProps,
): ComparableVerticalBarChartAction {
  const chart = mountComparableVerticalBarChart(node, props);
  return {
    update: (next: ComparableVerticalBarChartProps) => chart.update(next),
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
  props: DualBarChartProps,
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

export interface TreemapChartAction {
  update(props: TreemapChartProps): void;
  destroy(): void;
  getContext: ChartInstance<TreemapChartProps>["getContext"];
}

export function treemapChart(node: HTMLElement, props: TreemapChartProps): TreemapChartAction {
  const chart = mountTreemapChart(node, props);
  return {
    update: (next: TreemapChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

export interface PieChartAction {
  update(props: PieChartProps): void;
  destroy(): void;
  getContext: ChartInstance<PieChartProps>["getContext"];
}

export function pieChart(node: HTMLElement, props: PieChartProps): PieChartAction {
  const chart = mountPieChart(node, props);
  return {
    update: (next: PieChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

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

export interface SankeyChartAction {
  update(props: SankeyChartProps): void;
  destroy(): void;
  getContext: ChartInstance<SankeyChartProps>["getContext"];
}

export function sankeyChart(node: HTMLElement, props: SankeyChartProps): SankeyChartAction {
  const chart = mountSankeyChart(node, props);
  return {
    update: (next: SankeyChartProps) => chart.update(next),
    destroy: () => chart.destroy(),
    getContext: () => chart.getContext(),
  };
}

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
