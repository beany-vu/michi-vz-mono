// @michi-vz/devtools - opt-in in-page developer devtools for michi-vz charts.
// Inspect every chart's live ChartContext (incl. actual vs predicted provenance),
// diagnose sizing, inspect scales, diff snapshots, run AI insights, drive
// highlight/disable, and edit data. No browser extension needed.
//
//   import { mountDevtools } from "@michi-vz/devtools";
//   const devtools = mountDevtools();           // floating panel, toggle Ctrl/Cmd+Shift+M
//   // ... mount charts (mountLineChart, <michi-vz-*>, ...) ...
//   devtools.destroy();
//
// Gate the call behind process.env.NODE_ENV !== "production" (or import the inert
// "@michi-vz/devtools/production" entry) so app bundles never ship the panel.
export { mountDevtools } from "./panel";
export type { MountDevtoolsOptions, DevtoolsHandle, DevtoolsTheme, DevtoolsHotkey } from "./panel";
export { DEVTOOLS_CSS } from "./styles";
export { diffObjects, type DiffEntry } from "./diff";
export { auditContext, contrastRatio, findDuplicateColors, type A11yFinding, type AuditableContext } from "./a11y";

// Re-export the core hook surface so consumers can wire a custom UI / extension.
export {
  enableDevtools,
  getDevtoolsHook,
  type MichiVzDevtoolsHook,
  type DevtoolsChartEntry,
} from "@michi-vz/core";
