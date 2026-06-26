// @michi-vz/core — framework-agnostic rendering engine + renderer-agnostic
// ChartContext. Wrappers (wc/react/vue/angular/svelte) are thin shells over this.

// ---- Engine(s) ----
export { mountGapChart } from "./engine/gapChart";
export { mountLineChart } from "./engine/lineChart";
export { mountAreaChart } from "./engine/areaChart";
export { mountScatterChart } from "./engine/scatterChart";
export { mountVerticalStackBarChart } from "./engine/verticalStackBarChart";
export { mountComparableHorizontalBarChart } from "./engine/comparableHorizontalBarChart";
export { mountDualHorizontalBarChart } from "./engine/dualHorizontalBarChart";
export { mountBarBellChart } from "./engine/barBellChart";

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
// LineChart pure layer (reused by wrappers, insights, tests)
export { processLineChartData } from "./lineChart/data";
export { buildLineColors } from "./lineChart/colors";
export { buildLineContext } from "./context/buildLineContext";
export { checkLineData } from "./validate/lineWarnings";
export { applyGapDetection, parseAxisUnit } from "./lineChart/detectGaps";
export { lttb } from "./lineChart/lttb";
export { getRuns, makeLineGenerator } from "./lineChart/geometry";
export { DEFAULT_CURVE, resolveCurveFactory } from "./lineChart/curve";
// AreaChart pure layer
export { processAreaChartData } from "./areaChart/data";
export { buildAreaColors } from "./areaChart/colors";
export { makeAreaGenerator } from "./areaChart/geometry";
export { buildAreaContext } from "./context/buildAreaContext";
export { checkAreaData } from "./validate/areaWarnings";
// ScatterPlot pure layer
export { processScatterData } from "./scatterChart/data";
export { buildScatterColors } from "./scatterChart/colors";
export { buildScatterContext } from "./context/buildScatterContext";
export { checkScatterData } from "./validate/scatterWarnings";
// VerticalStackBar pure layer (incl. the hasOwnProperty marker guard in prepareStackedData)
export { extractDataKeys, resolveEffectiveKeys, collectDates, computeYDomain } from "./verticalStackBarChart/data";
export { prepareStackedData } from "./verticalStackBarChart/stack";
export { buildStackColors } from "./verticalStackBarChart/colors";
export { buildStackRenderModel } from "./verticalStackBarChart/renderModel";
export { buildStackContext } from "./context/buildStackContext";
export { checkStackData } from "./validate/stackWarnings";
// ComparableHorizontalBar pure layer
export { processComparableBarData } from "./comparableBar/data";
export { buildComparableBarColors } from "./comparableBar/colors";
export { buildComparableBarContext } from "./context/buildComparableBarContext";
// DualHorizontalBar pure layer
export { processDualBarData } from "./dualBar/data";
export { buildDualBarColors } from "./dualBar/colors";
export { buildDualBarContext } from "./context/buildDualBarContext";
// BarBell pure layer
export { processBarBellData } from "./barBell/data";
export { buildBarBellColors } from "./barBell/colors";
export { buildBarBellContext } from "./context/buildBarBellContext";

// ---- Shared imperative SVG builders (title/axes/loading/overlay) ----
export {
  renderTitle,
  renderXAxisLinear,
  renderXAxisBand,
  renderYAxisBand,
  renderYAxisLinear,
  renderLoadingIndicator,
  toggleLoadingIndicator,
  renderOverlay,
} from "./render/svg";
export type {
  TitleOptions,
  XAxisLinearOptions,
  XAxisBandOptions,
  LinearOrTimeScale,
  YAxisBandOptions,
  YAxisLinearOptions,
  LoadingIndicatorOptions,
  OverlayOptions,
} from "./render/svg";

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
  ChartA11yTable,
  BaseChartContext,
  GapChartContext,
  ChartContext,
  DataWarning,
  ChartInstance,
  CurveType,
  DataPoint,
  LineDataItem,
  SinglePointLineConfig,
  LineChartProps,
  LineSeriesContext,
  LineChartContext,
  AreaDataRow,
  AreaChartProps,
  AreaSeriesContext,
  AreaChartContext,
  ScatterDataPoint,
  ScatterChartProps,
  ScatterChartContext,
  VerticalStackBarDataPoint,
  VerticalStackBarDataSet,
  StackRectData,
  StackLegendItem,
  StackSeriesContext,
  VerticalStackBarChartProps,
  VerticalStackBarChartContext,
  ComparableBarDataPoint,
  ComparableBarChartProps,
  ComparableBarSeriesContext,
  ComparableBarChartContext,
  DualBarDataPoint,
  DualBarChartProps,
  DualBarSeriesContext,
  DualBarChartContext,
  BarBellDataRow,
  BarBellChartProps,
  BarBellSeriesContext,
  BarBellChartContext,
} from "./types";
