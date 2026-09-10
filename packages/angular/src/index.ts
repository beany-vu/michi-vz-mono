// Angular integration. Angular has first-class custom-element interop, so this
// package registers the <michi-vz-gap-chart> element and provides a typed helper
// for property binding from Angular templates (use CUSTOM_ELEMENTS_SCHEMA).
// An idiomatic standalone @Component wrapper (built with ng-packagr) is a later
// increment; this thin layer works today with zero Angular-compiler coupling.
//
// Back-compat barrel. Prefer the per-chart subpaths (@michi-vz/angular/line-chart)
// so a bundler can drop the 21 charts you do not use; this barrel registers every
// element by construction, because each re-exported module imports its own wc entry.
export { bindChart } from "./internal/bind";
export * from "./gauge-chart";
export * from "./line-chart";
export * from "./fan-chart";
export * from "./area-chart";
export * from "./scatter-chart";
export * from "./range-chart";
export * from "./ribbon-chart";
export * from "./radar-chart";
export * from "./vertical-stack-bar-chart";
export * from "./comparable-horizontal-bar-chart";
export * from "./comparable-vertical-bar-chart";
export * from "./dual-horizontal-bar-chart";
export * from "./bar-bell-chart";
export * from "./gap-chart";
export * from "./treemap-chart";
export * from "./pie-chart";
export * from "./bubble-chart";
export * from "./sankey-chart";
export * from "./fountain-chart";
export * from "./choropleth-map-chart";
export * from "./symbol-map-chart";
export * from "./radial-tree-chart";

// Data-item + config types a consumer needs to BUILD props (the *Props types
// alone force `LineChartProps["dataSet"][number]`-style indexing).
export type {
  DataPoint,
  LineDataItem,
  Margin,
  Filter,
  CurveType,
  XaxisDataType,
  MouseLineConfig,
  SinglePointLineConfig,
  SymbolMapDataItem,
  SymbolMapMarker,
  ChartContext,
} from "@michi-vz/core";
