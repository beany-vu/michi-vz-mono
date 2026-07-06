// Auto-registering barrel: importing @michi-vz/wc registers every element and
// (via the engine) auto-injects core.css. For tree-shakeable apps, import the
// per-element sub-path instead (e.g. "@michi-vz/wc/gap-chart").
import "./gap-chart";
import "./line-chart";
import "./area-chart";
import "./scatter-chart";
import "./vertical-stack-bar-chart";
import "./comparable-horizontal-bar-chart";
import "./comparable-vertical-bar-chart";
import "./dual-horizontal-bar-chart";
import "./bar-bell-chart";
import "./range-chart";
import "./ribbon-chart";
import "./radar-chart";
import "./fan-chart";
import "./treemap-chart";
import "./pie-chart";
import "./bubble-chart";
import "./sankey-chart";
import "./fountain-chart";
import "./choropleth-map-chart";

export { GapChartElement } from "./gap-chart";
export { LineChartElement } from "./line-chart";
export { AreaChartElement } from "./area-chart";
export { ScatterChartElement } from "./scatter-chart";
export { VerticalStackBarChartElement } from "./vertical-stack-bar-chart";
export { ComparableHorizontalBarChartElement } from "./comparable-horizontal-bar-chart";
export { ComparableVerticalBarChartElement } from "./comparable-vertical-bar-chart";
export { DualHorizontalBarChartElement } from "./dual-horizontal-bar-chart";
export { BarBellChartElement } from "./bar-bell-chart";
export { RangeChartElement } from "./range-chart";
export { RibbonChartElement } from "./ribbon-chart";
export { RadarChartElement } from "./radar-chart";
export { FanChartElement } from "./fan-chart";
export { TreemapChartElement } from "./treemap-chart";
export { PieChartElement } from "./pie-chart";
export { BubbleChartElement } from "./bubble-chart";
export { SankeyChartElement } from "./sankey-chart";
export { FountainChartElement } from "./fountain-chart";
export { ChoroplethMapChartElement } from "./choropleth-map-chart";
