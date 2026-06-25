// @michi-vz/core — framework-agnostic rendering engine + renderer-agnostic
// ChartContext. Wrappers (wc/react/vue/angular/svelte) are thin shells over this.

// ---- Engine(s) ----
export { mountGapChart } from "./engine/gapChart";

// ---- Shared state (replaces React MichiVzProvider context) ----
export { createMichiVzStore } from "./state/store";
export type { MichiVzStore, MichiVzState } from "./state/store";

// ---- Styling ----
export { CORE_CSS, ensureStyles } from "./styles";

// ---- i18n ----
export { defaultNumberFormatter, defaultXAxisFormatter } from "./i18n/formatters";

// ---- Theme ----
export { DEFAULT_COLORS } from "./theme/colors";

// ---- Pure utilities (reused by wrappers, insights, tests) ----
export { sanitizeForClassName } from "./math/sanitize";
export { processGapChartData } from "./gapChart/data";
export { buildGapColors } from "./gapChart/colors";
export { buildGapContext } from "./context/buildContext";
export { checkGapData } from "./validate/dataWarnings";

// ---- Canvas primitives (reused by other charts / insights) ----
export { setupCanvas } from "./canvas/setupCanvas";
export { resolveMarkColors, makeSimpleProbe } from "./canvas/resolveMarkColors";
export type { ColorProbe, ColorProp } from "./canvas/resolveMarkColors";

// ---- Types ----
export type {
  XaxisDataType,
  Shape,
  Margin,
  Filter,
  ShapeMapping,
  GapDataItem,
  GapChartProps,
  GapSeriesContext,
  ChartContext,
  DataWarning,
  ChartInstance,
} from "./types";
