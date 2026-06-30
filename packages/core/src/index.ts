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
export { mountRangeChart } from "./engine/rangeChart";
export { mountRibbonChart } from "./engine/ribbonChart";
export { mountRadarChart } from "./engine/radarChart";
export { mountFanChart } from "./engine/fanChart";
export { mountTreemapChart } from "./engine/treemapChart";
export { mountPieChart } from "./engine/pieChart";
export { mountBubbleChart } from "./engine/bubbleChart";
export { mountSankeyChart } from "./engine/sankeyChart";
export { mountFountainChart } from "./engine/fountainChart";

// ---- Shared state (replaces React MichiVzProvider context) ----
export { createMichiVzStore } from "./state/store";
export type { MichiVzStore, MichiVzState } from "./state/store";

// ---- Data state (loading / no-data decision; reused by wrappers) ----
export { evaluateDataState, resolveIsNodata } from "./state/dataState";
export type { DataState } from "./state/dataState";

// ---- Shared engine chrome (data-mv-state + font var + default overlays) ----
export { applyChartChrome, createChromeRefs } from "./render/chrome";
export type { ChromeRefs, ChromeProps } from "./render/chrome";

// ---- Shared-state → props merge (reused by every wrapper/coordinator) ----
export { resolveEffectiveProps } from "./state/effectiveProps";

// ---- Legend payload builder (flat colour-contract rows) ----
export { buildLegendData } from "./context/legend";
export type { LegendInput } from "./context/legend";

// ---- Plugin contract (consumed by @michi-vz/insights; interfaces only) ----
export type { MichiVzPlugin, PluginContext, AgentTool, Annotation } from "./plugins/types";
export type { MountOptions } from "./types";

// ---- Devtools hook (opt-in page-level registry consumed by @michi-vz/devtools) ----
export { enableDevtools, getDevtoolsHook, attachDevtools } from "./devtools/hook";
export type { MichiVzDevtoolsHook, DevtoolsChartEntry } from "./devtools/hook";

// ---- Styling ----
export { CORE_CSS, ensureStyles } from "./styles";

// ---- i18n ----
export { defaultNumberFormatter, defaultXAxisFormatter } from "./i18n/formatters";

// ---- Theme ----
export { DEFAULT_COLORS } from "./theme/colors";

// ---- Pure utilities (reused by wrappers, insights, tests) ----
export { sanitizeForClassName } from "./math/sanitize";
export { readableTextColor, relativeLuminance } from "./math/contrast";
export { isPredicted, provenanceCounts } from "./math/provenance";
export type { ProvenancePoint, ProvenanceCounts } from "./math/provenance";
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
// RangeChart pure layer
export { processRangeData } from "./rangeChart/data";
export { buildRangeColors } from "./rangeChart/colors";
export { buildRangeContext } from "./context/buildRangeContext";
// RibbonChart pure layer
export { processRibbonData } from "./ribbonChart/data";
export { buildRibbonColors } from "./ribbonChart/colors";
export { buildRibbonContext } from "./context/buildRibbonContext";
// RadarChart pure layer
export { processRadarData } from "./radarChart/data";
export { buildRadarColors } from "./radarChart/colors";
export { buildRadarContext } from "./context/buildRadarContext";
// FanChart (composes Line + Range; forecast fan)
export { buildFanContext } from "./context/buildFanContext";
// Treemap pure layer (hierarchical squarified tiling + two-part split)
export { processTreemapData } from "./treemapChart/data";
export { buildTreemapColors } from "./treemapChart/colors";
export { layoutTreemap, layoutStack } from "./treemapChart/layout";
export { buildTreemapRenderModel } from "./treemapChart/renderModel";
export { buildTreemapContext } from "./context/buildTreemapContext";
export { checkTreemapData } from "./validate/treemapWarnings";
// Pie pure layer (pie + donut via innerRadiusRatio)
export { processPieData } from "./pieChart/data";
export { buildPieColors } from "./pieChart/colors";
export { layoutPie } from "./pieChart/geometry";
export { buildPieRenderModel } from "./pieChart/renderModel";
export { buildPieContext } from "./context/buildPieContext";
export { checkPieData } from "./validate/pieWarnings";
// Bubble pure layer (gravity-packed circles + realized/untapped split)
export { processBubbleData } from "./bubbleChart/data";
export { buildBubbleColors } from "./bubbleChart/colors";
export { layoutBubbles } from "./bubbleChart/layout";
export { buildBubbleRenderModel } from "./bubbleChart/renderModel";
export { buildBubbleContext } from "./context/buildBubbleContext";
export { checkBubbleData } from "./validate/bubbleWarnings";
// Sankey pure layer (flow diagram via d3-sankey)
export { processSankeyData } from "./sankeyChart/data";
export { buildSankeyColors } from "./sankeyChart/colors";
export { layoutSankey } from "./sankeyChart/layout";
export { buildSankeyRenderModel } from "./sankeyChart/renderModel";
export { buildSankeyContext } from "./context/buildSankeyContext";
export { checkSankeyData } from "./validate/sankeyWarnings";
// Fountain ("Jet d'Eau") pure layer (rising column + blooming plume; snapshot/trend)
export { processFountainData } from "./fountainChart/data";
export { buildFountainColors } from "./fountainChart/colors";
export { createFountainScales } from "./fountainChart/scales";
export { buildJetPath, buildFrothSlices, buildDropletPaths, buildMistPath } from "./fountainChart/geometry";
export { buildFountainRenderModel } from "./fountainChart/renderModel";
export { buildFountainContext } from "./context/buildFountainContext";

// ---- Shared imperative SVG builders (title/axes/loading/overlay) ----
export {
  renderTitle,
  renderXAxisLinear,
  renderXAxisBand,
  renderYAxisBand,
  renderYAxisLinear,
  renderLoadingIndicator,
  toggleLoadingIndicator,
  toggleNodataIndicator,
  renderOverlay,
  renderAnnotationsSvg,
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
  AnnotationRenderContext,
} from "./render/svg";

// ---- Canvas primitives (reused by other charts / insights) ----
export { setupCanvas } from "./canvas/setupCanvas";
export { resolveMarkColors, makeSimpleProbe } from "./canvas/resolveMarkColors";
export type { ColorProbe, ColorProp } from "./canvas/resolveMarkColors";
export { createHatchPattern } from "./canvas/createHatchPattern";
export type { HatchPatternOptions } from "./canvas/createHatchPattern";

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
  LegendItem,
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
  StackTooltipData,
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
  RangeDataPoint,
  RangeDataItem,
  RangeChartProps,
  RangeSeriesContext,
  RangeChartContext,
  RibbonDataRow,
  RibbonChartProps,
  RibbonSeriesContext,
  RibbonChartContext,
  RadarDataItem,
  RadarChartProps,
  RadarSeriesContext,
  RadarChartContext,
  FanBand,
  FanDataItem,
  FanChartProps,
  FanSeriesContext,
  FanChartContext,
  TreemapNode,
  TreemapChartProps,
  TreemapLeafContext,
  TreemapChartContext,
  PieDataItem,
  PieChartProps,
  PieSliceContext,
  PieChartContext,
  BubbleDataItem,
  BubbleChartProps,
  BubbleContext,
  BubbleChartContext,
  SankeyNodeItem,
  SankeyLinkItem,
  SankeyChartProps,
  SankeyNodeContext,
  SankeyLinkContext,
  SankeyChartContext,
  FountainXAxisType,
  FountainDataItem,
  FountainChartProps,
  FountainJetContext,
  FountainChartContext,
} from "./types";
