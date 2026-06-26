// Public, framework-agnostic types for the engine.

export type XaxisDataType = "date_annual" | "date_monthly" | "number";
export type Shape = "circle" | "square" | "triangle";

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Filter {
  limit: number;
  date: number | string;
  criteria: string;
  sortingDir: "asc" | "desc";
}

export interface ShapeMapping {
  value1?: string;
  value2?: string;
  gap?: string;
}

// ---- GapChart ----

export interface GapDataItem {
  label: string;
  code?: string;
  value1: number;
  value2: number;
  // difference is value1 - value2 by default; used for sorting when `filter` set.
  difference?: number;
  date?: string;
}

export interface GapChartProps {
  dataSet: GapDataItem[];
  title?: string;
  width?: number;
  height?: number;
  margin?: Margin;
  colors?: string[];
  colorsMapping?: Record<string, string>;
  colorMode?: "label" | "shape";
  shapeColorsMapping?: ShapeMapping;
  shapesLabelsMapping?: ShapeMapping;
  highlightItems?: string[];
  disabledItems?: string[];
  filter?: Filter;
  shapeValue1?: Shape;
  shapeValue2?: Shape;
  xAxisDataType?: XaxisDataType;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  ticks?: number;
  tickValues?: Array<number | Date>;
  tickHtmlWidth?: number;
  squareRadius?: number;
  renderer?: "svg" | "canvas";
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to "transparent" and the chart
   * does not emit onColorMappingGenerated. Mark colours then come from consumer
   * CSS via the data-label-safe color contract. */
  skipColorMappingDispatch?: boolean;
  showLegend?: boolean;
  legendAlign?: "left" | "center" | "right";
  enableTransitions?: boolean;
  tooltipFormatter?: (d: GapDataItem) => string;
  onHighlightItem?: (item: GapDataItem | null) => void;
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  onChartDataProcessed?: (context: ChartContext) => void;
  onDataWarning?: (warnings: DataWarning[]) => void;
}

// ---- Renderer-agnostic semantic context (LLM / a11y / agent) ----

export interface GapSeriesContext {
  label: string;
  code?: string;
  value1: number;
  value2: number;
  difference: number;
  gap: number;
}

/** Chart-agnostic semantic table for the a11y mirror + DOM-scraping/LLM tools.
 * Every chart's buildContext fills this so the mirror renders without knowing
 * the chart's series shape. */
export interface ChartA11yTable {
  headers: string[];
  rows: Array<Array<string | number>>;
}

/** Fields every chart context shares. The a11y mirror and any generic tooling
 * depend ONLY on this base; per-chart specifics live on the union members below.
 * `chartType` is `string` here but a literal on each member, so the union
 * narrows on it (see TS discriminated-union rules). */
export interface BaseChartContext {
  chartType: string;
  title?: string;
  renderer: "svg" | "canvas";
  colorsMapping: Record<string, string>;
  /** Deterministic, rule-based natural-language summary. No model required;
   * doubles as accessibility alt text. */
  summary: string;
  a11yTable: ChartA11yTable;
}

export interface GapChartContext extends BaseChartContext {
  chartType: "gap-chart";
  xAxis: { type: XaxisDataType; domain: [number, number] };
  yAxis: { labels: string[] };
  series: GapSeriesContext[];
  stats: {
    count: number;
    maxGap: { label: string; value: number } | null;
    minGap: { label: string; value: number } | null;
    meanGap: number;
    totalValue1: number;
    totalValue2: number;
  };
}

// ---- LineChart ----

export type CurveType = "curveBumpX" | "curveLinear" | "curveMonotoneX";

export interface DataPoint {
  /** Numeric value, year, or date string — parsed per xAxisDataType. */
  date: number | string;
  value: number;
  label?: string;
  /** The segment INTO this point is solid (true) or dashed/uncertain (false). */
  certainty: boolean;
  code?: string;
}

export interface LineDataItem {
  label: string;
  color?: string;
  shape?: Shape;
  curve?: CurveType;
  series: DataPoint[];
}

/** Guide line drawn for single-point series (a lone point has no line to read). */
export interface SinglePointLineConfig {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface LineChartProps {
  dataSet: LineDataItem[];
  title?: string;
  width?: number;
  height?: number;
  margin?: Margin;
  colors?: string[];
  colorsMapping?: Record<string, string>;
  yAxisDomain?: [number, number];
  xAxisDataType?: XaxisDataType;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  ticks?: number;
  tickValues?: Array<number | Date>;
  /** Default interpolation for every series (per-series `curve` wins). */
  curve?: CurveType;
  /** Auto-derive `certainty` from missing periods (dashes the gap segment). */
  detectGaps?: boolean;
  /** Expected cadence in axis units; REQUIRED for xAxisDataType "number". */
  expectedStep?: number;
  showDataPoints?: boolean;
  enableMouseLine?: boolean;
  /** true / config draws a horizontal guide line for single-point series. */
  singlePointLine?: boolean | SinglePointLineConfig;
  highlightItems?: string[];
  disabledItems?: string[];
  filter?: Filter;
  renderer?: "svg" | "canvas";
  locale?: string;
  skipColorMappingDispatch?: boolean;
  enableTransitions?: boolean;
  tooltipFormatter?: (d: DataPoint, series: DataPoint[], dataSet: LineDataItem[]) => string;
  onHighlightItem?: (labels: string[]) => void;
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  onChartDataProcessed?: (context: ChartContext) => void;
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface LineSeriesContext {
  label: string;
  code?: string;
  color: string;
  pointCount: number;
  first: { x: number | string; y: number } | null;
  last: { x: number | string; y: number } | null;
  min: number;
  max: number;
  mean: number;
  /** last.y - first.y. */
  change: number;
  /** percent change vs first value, or null when first is 0/absent. */
  changePct: number | null;
  trend: "up" | "down" | "flat";
  /** count of uncertain (dashed / gap) segments. */
  gaps: number;
}

export interface LineChartContext extends BaseChartContext {
  chartType: "line-chart";
  xAxis: { type: XaxisDataType; domain: [number, number] };
  yAxis: { domain: [number, number] };
  series: LineSeriesContext[];
  stats: {
    seriesCount: number;
    pointCount: number;
    largestMover: { label: string; change: number } | null;
    valueRange: [number, number];
  };
}

// ---- AreaChart (stacked) ----

/** One row: an x (`date`) plus one numeric value per stacked key. */
export interface AreaDataRow {
  date: number | string;
  [key: string]: number | string | undefined;
}

export interface AreaChartProps {
  series: AreaDataRow[];
  /** Category keys to stack (bottom-to-top); disabledItems removes from the stack. */
  keys: string[];
  title?: string;
  width?: number;
  height?: number;
  margin?: Margin;
  colors?: string[];
  colorsMapping?: Record<string, string>;
  xAxisDataType?: XaxisDataType;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  yAxisDomain?: [number, number];
  /** Fix the y-axis to [0,100] regardless of data (display only; data not normalized). */
  forcePercentageScale?: boolean;
  ticks?: number;
  tickValues?: Array<number | Date>;
  curve?: CurveType;
  highlightItems?: string[];
  disabledItems?: string[];
  renderer?: "svg" | "canvas";
  locale?: string;
  skipColorMappingDispatch?: boolean;
  enableTransitions?: boolean;
  tooltipFormatter?: (row: AreaDataRow, key: string, series: AreaDataRow[]) => string;
  onHighlightItem?: (labels: string[]) => void;
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  onChartDataProcessed?: (context: ChartContext) => void;
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface AreaSeriesContext {
  key: string;
  color: string;
  /** sum of this key across all rows. */
  total: number;
  min: number;
  max: number;
  mean: number;
}

export interface AreaChartContext extends BaseChartContext {
  chartType: "area-chart";
  xAxis: { type: XaxisDataType; domain: [number, number] };
  yAxis: { domain: [number, number] };
  keys: string[];
  series: AreaSeriesContext[];
  stats: {
    keyCount: number;
    rowCount: number;
    grandTotal: number;
    largestKey: { key: string; total: number } | null;
  };
}

// ---- ScatterPlotChart ----

export interface ScatterDataPoint {
  x: number;
  y: number;
  label: string;
  color?: string;
  /** Size value (drives the radius via the size scale). Omit for a fixed radius. */
  d?: number;
  shape?: Shape;
  code?: string;
  date?: string;
}

export interface ScatterChartProps {
  dataSet: ScatterDataPoint[];
  title?: string;
  width?: number;
  height?: number;
  margin?: Margin;
  colors?: string[];
  colorsMapping?: Record<string, string>;
  /** number / date for x (band x deferred). y is always linear. */
  xAxisDataType?: XaxisDataType;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  xAxisDomain?: [number, number];
  yAxisDomain?: [number, number];
  /** [minRadius, maxRadius] px for the size scale (default [4, 20]). */
  sizeRange?: [number, number];
  ticks?: number;
  tickValues?: Array<number | Date>;
  highlightItems?: string[];
  disabledItems?: string[];
  filter?: Filter;
  renderer?: "svg" | "canvas";
  locale?: string;
  skipColorMappingDispatch?: boolean;
  enableTransitions?: boolean;
  tooltipFormatter?: (d: ScatterDataPoint) => string;
  onHighlightItem?: (labels: string[]) => void;
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  onChartDataProcessed?: (context: ChartContext) => void;
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface ScatterChartContext extends BaseChartContext {
  chartType: "scatter-plot-chart";
  xAxis: { type: XaxisDataType; domain: [number, number] };
  yAxis: { domain: [number, number] };
  pointCount: number;
  stats: {
    xMean: number;
    yMean: number;
    /** Pearson correlation of x,y across points, or null when undefined. */
    correlation: number | null;
  };
}

// ---- VerticalStackBarChart ----

export interface VerticalStackBarDataPoint {
  date: string | null;
  /** Numeric segment values keyed by name (string|number); "code" is reserved
   * and excluded from stack keys. */
  [key: string]: string | number | null | undefined;
}

export interface VerticalStackBarDataSet {
  seriesKey: string;
  seriesKeyAbbreviation: string;
  series: VerticalStackBarDataPoint[];
  label?: string;
}

/** One stacked segment rect (geometry + provenance). */
export interface StackRectData {
  key: string;
  height: number;
  width: number;
  y: number;
  x: number;
  data: VerticalStackBarDataPoint;
  fill: string;
  seriesKey: string;
  seriesKeyAbbreviation: string;
  value: number | null;
  date: string | null;
  code?: string;
  /** true only for missing-data marker stubs (the hasOwnProperty guard path). */
  isMissing?: boolean;
}

export interface StackLegendItem {
  label: string;
  color: string;
  order: number;
  disabled?: boolean;
  dataLabelSafe?: string;
}

export interface VerticalStackBarChartProps {
  dataSet: VerticalStackBarDataSet[];
  /** Explicit stack order; present keys first (in this order), natural keys appended. */
  keys?: string[];
  keysOrder?: "topToBottom" | "bottomToTop";
  title?: string;
  width?: number;
  height?: number;
  margin?: Margin;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  xAxisDomain?: string[];
  yAxisDomain?: [number, number];
  colors?: string[];
  colorsMapping?: Record<string, string>;
  minBarWidth?: number;
  minBarHeight?: number;
  minBarHeightZero?: number;
  /** Opt-in thin stub on the zero line for explicitly-missing (null/NaN) owned keys. */
  missingDataMarker?: { height: number };
  filter?: { limit: number; sortingDir: "asc" | "desc"; date?: string };
  highlightItems?: string[];
  disabledItems?: string[];
  renderer?: "svg" | "canvas";
  locale?: string;
  skipColorMappingDispatch?: boolean;
  enableTransitions?: boolean;
  tooltipFormatter?: (rect: StackRectData) => string;
  onHighlightItem?: (labels: string[]) => void;
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  onLegendDataChange?: (legendData: StackLegendItem[]) => void;
  onChartDataProcessed?: (context: ChartContext) => void;
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface StackSeriesContext {
  key: string;
  color: string;
  total: number;
  byDate: Array<{ date: string; value: number | null; isMissing: boolean }>;
}

export interface VerticalStackBarChartContext extends BaseChartContext {
  chartType: "vertical-stack-bar-chart";
  xAxis: { type: "band"; domain: string[] };
  yAxis: { domain: [number, number] };
  keys: string[];
  visibleItems: string[];
  series: StackSeriesContext[];
  legend: StackLegendItem[];
  stats: {
    seriesCount: number;
    dateCount: number;
    grandTotal: number;
    perDateTotals: Array<{ date: string; total: number }>;
    largestSegment: { key: string; date: string; value: number } | null;
  };
}

// ---- ComparableHorizontalBarChart ----

export interface ComparableBarDataPoint {
  label: string;
  color?: string;
  valueBased: number;
  valueCompared: number;
}

export interface ComparableBarChartProps {
  dataSet: ComparableBarDataPoint[];
  title?: string;
  width?: number;
  height?: number;
  margin?: Margin;
  colors?: string[];
  colorsMapping?: Record<string, string>;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  xAxisDomain?: [number, number];
  ticks?: number;
  tickHtmlWidth?: number;
  /** Fill opacity of the two sub-bars (historical look: 0.45 / 0.9). */
  valueBasedOpacity?: number;
  valueComparedOpacity?: number;
  filter?: { limit: number; criteria: "valueBased" | "valueCompared"; sortingDir: "asc" | "desc" };
  highlightItems?: string[];
  disabledItems?: string[];
  renderer?: "svg" | "canvas";
  locale?: string;
  skipColorMappingDispatch?: boolean;
  enableTransitions?: boolean;
  tooltipFormatter?: (d: ComparableBarDataPoint) => string;
  onHighlightItem?: (labels: string[]) => void;
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  onChartDataProcessed?: (context: ChartContext) => void;
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface ComparableBarSeriesContext {
  label: string;
  color: string;
  valueBased: number;
  valueCompared: number;
  /** valueCompared - valueBased. */
  difference: number;
}

export interface ComparableBarChartContext extends BaseChartContext {
  chartType: "comparable-horizontal-bar-chart";
  xAxis: { domain: [number, number] };
  yAxis: { labels: string[] };
  series: ComparableBarSeriesContext[];
  stats: {
    count: number;
    totalBased: number;
    totalCompared: number;
    largestMover: { label: string; difference: number } | null;
  };
}

// ---- DualHorizontalBarChart (diverging / tornado) ----

export interface DualBarDataPoint {
  label: string;
  color?: string;
  value1: number;
  value2: number;
}

export interface DualBarChartProps {
  dataSet: DualBarDataPoint[];
  title?: string;
  width?: number;
  height?: number;
  margin?: Margin;
  colors?: string[];
  colorsMapping?: Record<string, string>;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  xAxisDomain?: [number, number];
  ticks?: number;
  tickHtmlWidth?: number;
  /** value1 (right) / value2 (left) fill opacities. */
  value1Opacity?: number;
  value2Opacity?: number;
  filter?: { limit: number; criteria: "value1" | "value2"; sortingDir: "asc" | "desc" };
  highlightItems?: string[];
  disabledItems?: string[];
  renderer?: "svg" | "canvas";
  locale?: string;
  skipColorMappingDispatch?: boolean;
  enableTransitions?: boolean;
  tooltipFormatter?: (d: DualBarDataPoint) => string;
  onHighlightItem?: (labels: string[]) => void;
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  onChartDataProcessed?: (context: ChartContext) => void;
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface DualBarSeriesContext {
  label: string;
  color: string;
  value1: number;
  value2: number;
}

export interface DualBarChartContext extends BaseChartContext {
  chartType: "dual-horizontal-bar-chart";
  xAxis: { domain: [number, number] };
  yAxis: { labels: string[] };
  series: DualBarSeriesContext[];
  stats: { count: number; total1: number; total2: number };
}

// ---- BarBellChart (cumulative horizontal bar + end-cap circles) ----

export interface BarBellDataRow {
  date: string | number;
  [key: string]: number | string | undefined;
}

export interface BarBellChartProps {
  dataSet: BarBellDataRow[];
  keys: string[];
  title?: string;
  width?: number;
  height?: number;
  margin?: Margin;
  colors?: string[];
  colorsMapping?: Record<string, string>;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  yAxisDomain?: [number, number];
  ticks?: number;
  tickHtmlWidth?: number;
  highlightItems?: string[];
  disabledItems?: string[];
  renderer?: "svg" | "canvas";
  locale?: string;
  skipColorMappingDispatch?: boolean;
  enableTransitions?: boolean;
  tooltipFormatter?: (row: BarBellDataRow, key: string, value: number) => string;
  onHighlightItem?: (labels: string[]) => void;
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  onChartDataProcessed?: (context: ChartContext) => void;
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface BarBellSeriesContext {
  key: string;
  color: string;
  total: number;
}

export interface BarBellChartContext extends BaseChartContext {
  chartType: "bar-bell-chart";
  xAxis: { domain: [number, number] };
  yAxis: { labels: string[] };
  keys: string[];
  series: BarBellSeriesContext[];
  stats: { keyCount: number; rowCount: number; grandTotal: number };
}

// ---- RangeChart (per-series valueMin..valueMax bands over time) ----

export interface RangeDataPoint {
  date: number | string;
  valueMin: number;
  valueMax: number;
  valueMedium?: number;
  certainty?: boolean;
  label?: string;
  code?: string;
}

export interface RangeDataItem {
  label: string;
  color?: string;
  series: RangeDataPoint[];
}

export interface RangeChartProps {
  dataSet: RangeDataItem[];
  title?: string;
  width?: number;
  height?: number;
  margin?: Margin;
  colors?: string[];
  colorsMapping?: Record<string, string>;
  xAxisDataType?: XaxisDataType;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  yAxisDomain?: [number, number];
  ticks?: number;
  tickValues?: Array<number | Date>;
  curve?: CurveType;
  /** band fill opacity (default 0.8). */
  fillOpacity?: number;
  highlightItems?: string[];
  disabledItems?: string[];
  renderer?: "svg" | "canvas";
  locale?: string;
  skipColorMappingDispatch?: boolean;
  enableTransitions?: boolean;
  tooltipFormatter?: (d: RangeDataPoint, item: RangeDataItem) => string;
  onHighlightItem?: (labels: string[]) => void;
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  onChartDataProcessed?: (context: ChartContext) => void;
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface RangeSeriesContext {
  label: string;
  color: string;
  pointCount: number;
  minValue: number;
  maxValue: number;
  /** mean band width (valueMax - valueMin) across points. */
  meanRange: number;
}

export interface RangeChartContext extends BaseChartContext {
  chartType: "range-chart";
  xAxis: { type: XaxisDataType; domain: [number, number] };
  yAxis: { domain: [number, number] };
  series: RangeSeriesContext[];
  stats: { seriesCount: number; pointCount: number; valueRange: [number, number] };
}

// ---- RibbonChart (stacked columns + connecting ribbons) ----

export interface RibbonDataRow {
  date: string | number;
  [key: string]: number | string | undefined;
}

export interface RibbonChartProps {
  series: RibbonDataRow[];
  keys: string[];
  title?: string;
  width?: number;
  height?: number;
  margin?: Margin;
  colors?: string[];
  colorsMapping?: Record<string, string>;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  yAxisDomain?: [number, number];
  /** column width in px (default 30). */
  columnWidth?: number;
  ticks?: number;
  highlightItems?: string[];
  disabledItems?: string[];
  renderer?: "svg" | "canvas";
  locale?: string;
  skipColorMappingDispatch?: boolean;
  enableTransitions?: boolean;
  tooltipFormatter?: (row: RibbonDataRow, key: string, value: number) => string;
  onHighlightItem?: (labels: string[]) => void;
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  onChartDataProcessed?: (context: ChartContext) => void;
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface RibbonSeriesContext {
  key: string;
  color: string;
  total: number;
}

export interface RibbonChartContext extends BaseChartContext {
  chartType: "ribbon-chart";
  xAxis: { domain: string[] };
  yAxis: { domain: [number, number] };
  keys: string[];
  series: RibbonSeriesContext[];
  stats: { keyCount: number; dateCount: number; grandTotal: number };
}

// ---- RadarChart (polar) ----

export interface RadarDataItem {
  label: string;
  color?: string;
  /** one value per axis, aligned to `axes` by index. */
  values: number[];
}

export interface RadarChartProps {
  series: RadarDataItem[];
  /** spoke labels (the radial axes). */
  axes: string[];
  title?: string;
  width?: number;
  height?: number;
  margin?: Margin;
  colors?: string[];
  colorsMapping?: Record<string, string>;
  maxValue?: number;
  /** number of concentric grid rings (default 4). */
  rings?: number;
  /** polygon fill opacity (default 0.2). */
  fillOpacity?: number;
  highlightItems?: string[];
  disabledItems?: string[];
  renderer?: "svg" | "canvas";
  locale?: string;
  skipColorMappingDispatch?: boolean;
  enableTransitions?: boolean;
  tooltipFormatter?: (item: RadarDataItem) => string;
  onHighlightItem?: (labels: string[]) => void;
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  onChartDataProcessed?: (context: ChartContext) => void;
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface RadarSeriesContext {
  label: string;
  color: string;
  /** axis label -> value. */
  byAxis: Array<{ axis: string; value: number }>;
  total: number;
  /** axis with the largest value. */
  peakAxis: string | null;
}

export interface RadarChartContext extends BaseChartContext {
  chartType: "radar-chart";
  axes: string[];
  maxValue: number;
  series: RadarSeriesContext[];
  stats: { seriesCount: number; axisCount: number };
}

/** Discriminated union of every chart's context, keyed on `chartType`. */
export type ChartContext =
  | GapChartContext
  | LineChartContext
  | AreaChartContext
  | ScatterChartContext
  | VerticalStackBarChartContext
  | ComparableBarChartContext
  | DualBarChartContext
  | BarBellChartContext
  | RangeChartContext
  | RibbonChartContext
  | RadarChartContext;

export interface DataWarning {
  type:
    | "non-finite-value"
    | "duplicate-label"
    | "difference-mismatch"
    | "empty-dataset"
    | "non-monotonic-date"
    | "duplicate-date";
  message: string;
  label?: string;
}

// ---- Engine instance ----

export interface ChartInstance<P> {
  update(props: P): void;
  getContext(): ChartContext | null;
  destroy(): void;
}
