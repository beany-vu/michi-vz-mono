// @michi-vz/devtools - opt-in in-page developer devtools for michi-vz charts.
// Inspect every chart's live ChartContext (incl. actual vs predicted provenance),
// drive highlight/disable + agent tools, and edit data. No browser extension needed.
//
//   import { mountDevtools } from "@michi-vz/devtools";
//   const devtools = mountDevtools();           // floating panel, toggle Ctrl/Cmd+Shift+M
//   // ... mount charts (mountLineChart, <michi-vz-*>, ...) ...
//   devtools.destroy();
export { mountDevtools } from "./panel";
export type { MountDevtoolsOptions, DevtoolsHandle } from "./panel";
export { DEVTOOLS_CSS } from "./styles";

// Re-export the core hook surface so consumers can wire a custom UI / extension.
export {
  enableDevtools,
  getDevtoolsHook,
  type MichiVzDevtoolsHook,
  type DevtoolsChartEntry,
} from "@michi-vz/core";
