// Auto-registering barrel: importing @michi-vz/wc registers every element and
// (via the engine) auto-injects core.css. For tree-shakeable apps, import the
// per-element sub-path instead (e.g. "@michi-vz/wc/gap-chart").
import "./gap-chart";

export { GapChartElement } from "./gap-chart";
