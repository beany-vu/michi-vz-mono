// Vue 3 wrapper over the @michi-vz/core engine. Takes the engine props as a
// single `options` object; mounts on `onMounted` (client-only, SSR-safe).
//
// Back-compat barrel. Prefer the per-chart subpaths (@michi-vz/vue/line-chart)
// so a bundler can drop the 21 charts you do not use; this barrel pulls in all 22.
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

export type { ChartContext } from "@michi-vz/core";
