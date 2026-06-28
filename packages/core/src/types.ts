// Public, framework-agnostic types for the engine.

export type XaxisDataType = "date_annual" | "date_monthly" | "number";
export type Shape = "circle" | "square" | "triangle";

export interface Margin {
  /** Top inner padding in px between the SVG edge and the plot area (also reserves room for the title) */
  top: number;
  /** Right inner padding in px between the SVG edge and the plot area */
  right: number;
  /** Bottom inner padding in px reserved for the x-axis */
  bottom: number;
  /** Left inner padding in px reserved for the y-axis labels */
  left: number;
}

export interface Filter {
  /** Keep only the top-N rows after sorting by `criteria` */
  limit: number;
  /** Restrict to rows matching this `date` value before sorting (omit/empty to use all rows) */
  date: number | string;
  /** Name of the numeric field to sort rows by before applying `limit` */
  criteria: string;
  /** Sort direction applied before `limit`: "desc" (largest first) or "asc" (smallest first) */
  sortingDir: "asc" | "desc";
}

export interface ShapeMapping {
  /** Color for the value1 marker when colorMode is "shape" */
  value1?: string;
  /** Color for the value2 marker when colorMode is "shape" */
  value2?: string;
  /** Color for the connecting gap bar when colorMode is "shape" */
  gap?: string;
}

// ---- GapChart ----

export interface GapDataItem {
  /** Row name; drives the y-axis label, the per-label color, and the data-label CSS hook */
  label: string;
  /** Optional stable identifier carried through to the context (e.g. an ISO/country code), not displayed */
  code?: string;
  /** First endpoint value plotted as the value1 marker on the row */
  value1: number;
  /** Second endpoint value plotted as the value2 marker on the row */
  value2: number;
  // difference is value1 - value2 by default; used for sorting when `filter` set.
  /** Optional precomputed gap magnitude; defaults to value1 - value2 and is the field sorted on when `filter` is set */
  difference?: number;
  /** Optional period tag used to select rows when `filter.date` is provided */
  date?: string;
}

export interface GapChartProps {
  /** Array of rows, one horizontal value1->value2 gap bar per item */
  dataSet: GapDataItem[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Whether marks are colored per row label ("label", default) or per role/shape via shapeColorsMapping ("shape") */
  colorMode?: "label" | "shape";
  /** When colorMode is "shape", the colors for the value1, value2, and gap parts */
  shapeColorsMapping?: ShapeMapping;
  /** Optional display labels for the value1/value2/gap roles (e.g. legend captions) */
  shapesLabelsMapping?: ShapeMapping;
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Top-N / sort filter applied to the data before rendering */
  filter?: Filter;
  /** Marker shape for the value1 endpoint: "circle" (default), "square", or "triangle" */
  shapeValue1?: Shape;
  /** Marker shape for the value2 endpoint: "circle" (default), "square", or "triangle" */
  shapeValue2?: Shape;
  /** How x values are parsed and formatted: yearly dates, monthly dates, or plain numbers */
  xAxisDataType?: XaxisDataType;
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Approximate number of axis ticks to generate */
  ticks?: number;
  /** Explicit tick values, overriding the generated ones */
  tickValues?: Array<number | Date>;
  /** Width in px of the HTML y-axis label box, which ellipsizes longer labels (default 100) */
  tickHtmlWidth?: number;
  /** Corner radius in px for square markers (default 2) */
  squareRadius?: number;
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to "transparent" and the chart
   * does not emit onColorMappingGenerated. Mark colours then come from consumer
   * CSS via the data-label-safe color contract. */
  skipColorMappingDispatch?: boolean;
  /** Whether to render a legend */
  showLegend?: boolean;
  /** Horizontal alignment of the legend: "left", "center", or "right" */
  legendAlign?: "left" | "center" | "right";
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (d: GapDataItem) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (item: GapDataItem | null) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

// ---- Renderer-agnostic semantic context (LLM / a11y / agent) ----

export interface GapSeriesContext {
  label: string;
  /** Optional stable identifier carried into the context (e.g. an ISO code); not displayed */
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
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer: "svg" | "canvas";
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
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
  /** Y value of the point */
  value: number;
  /** Optional per-point label */
  label?: string;
  /** The segment INTO this point is solid (true) or dashed/uncertain (false). */
  certainty: boolean;
  /**
   * Explicit provenance: `true` = forecast/projection, `false` = observed/actual.
   * Optional; when omitted it derives from `certainty === false`. Prefer this over
   * `certainty` to mark forecasts, since `certainty` is also flipped by detectGaps.
   */
  predicted?: boolean;
  /** Optional stable identifier carried into the context, not displayed */
  code?: string;
}

export interface LineDataItem {
  /** Series name; drives the legend, the per-series color, and the data-label CSS hook */
  label: string;
  /** Optional explicit line color overriding the generated palette color for this series */
  color?: string;
  /** Optional data-point marker shape for this series: "circle", "square", or "triangle" */
  shape?: Shape;
  /** Optional per-series interpolation overriding the chart-level `curve` */
  curve?: CurveType;
  /** Ordered array of points making up this line */
  series: DataPoint[];
}

/** Guide line drawn for single-point series (a lone point has no line to read). */
export interface SinglePointLineConfig {
  /** Stroke color of the horizontal guide line drawn for single-point series */
  stroke?: string;
  /** Stroke width in px of the single-point guide line */
  strokeWidth?: number;
  /** SVG dash pattern for the single-point guide line (e.g. "4,4") */
  strokeDasharray?: string;
}

export interface LineChartProps {
  /** Array of line series, each with its own points */
  dataSet: LineDataItem[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Fix the y-axis range as [min, max] instead of deriving it from the data */
  yAxisDomain?: [number, number];
  /** How x values are parsed and formatted: yearly dates, monthly dates, or plain numbers */
  xAxisDataType?: XaxisDataType;
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Approximate number of axis ticks to generate */
  ticks?: number;
  /** Explicit tick values, overriding the generated ones */
  tickValues?: Array<number | Date>;
  /** Default interpolation for every series (per-series `curve` wins). */
  curve?: CurveType;
  /** Auto-derive `certainty` from missing periods (dashes the gap segment). */
  detectGaps?: boolean;
  /** Expected cadence in axis units; REQUIRED for xAxisDataType "number". */
  expectedStep?: number;
  /** Whether to draw a marker at each data point (default false) */
  showDataPoints?: boolean;
  /** Whether to show a dashed vertical crosshair line that tracks the cursor (default false) */
  enableMouseLine?: boolean;
  /** true / config draws a horizontal guide line for single-point series. */
  singlePointLine?: boolean | SinglePointLineConfig;
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Top-N / sort filter applied to the data before rendering */
  filter?: Filter;
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (d: DataPoint, series: DataPoint[], dataSet: LineDataItem[]) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface LineSeriesContext {
  label: string;
  /** Optional stable identifier carried into the context (e.g. an ISO code); not displayed */
  code?: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
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
  /** count of observed/actual points (provenance: predicted falsy). */
  actualCount: number;
  /** count of forecast/predicted points. */
  predictedCount: number;
  /** x of the first predicted point (forecast boundary), or null when none. */
  forecastStart: number | string | null;
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
  /** X position of the row: a number, year, or date string parsed per xAxisDataType */
  date: number | string;
  /**
   * Marks this whole row (date) as a forecast/projection rather than observed data.
   * Row-level because a stacked area shares one x across every key. Surfaces in the
   * context as `stats.predictedRows` / `stats.forecastStart`.
   */
  predicted?: boolean;
  [key: string]: number | string | boolean | undefined;
}

export interface AreaChartProps {
  /** Array of rows, each carrying an x (`date`) plus one numeric value per stacked key */
  series: AreaDataRow[];
  /** Category keys to stack (bottom-to-top); disabledItems removes from the stack. */
  keys: string[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** How x values are parsed and formatted: yearly dates, monthly dates, or plain numbers */
  xAxisDataType?: XaxisDataType;
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Fix the y-axis range as [min, max] instead of deriving it from the data */
  yAxisDomain?: [number, number];
  /** Fix the y-axis to [0,100] regardless of data (display only; data not normalized). */
  forcePercentageScale?: boolean;
  /** Approximate number of axis ticks to generate */
  ticks?: number;
  /** Explicit tick values, overriding the generated ones */
  tickValues?: Array<number | Date>;
  /** Line interpolation: curveLinear, curveMonotoneX, or curveBumpX */
  curve?: CurveType;
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (row: AreaDataRow, key: string, series: AreaDataRow[]) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface AreaSeriesContext {
  key: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
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
    /** count of observed/actual rows (dates). */
    actualRows: number;
    /** count of forecast/predicted rows (dates). */
    predictedRows: number;
    /** date of the first predicted row (forecast boundary), or null when none. */
    forecastStart: number | string | null;
  };
}

// ---- ScatterPlotChart ----

export interface ScatterDataPoint {
  /** X coordinate of the point */
  x: number;
  /** Y coordinate of the point */
  y: number;
  /** Point name; drives the per-point color and the data-label CSS hook */
  label: string;
  /** Optional explicit color overriding the generated palette color for this point */
  color?: string;
  /** Size value (drives the radius via the size scale). Omit for a fixed radius. */
  d?: number;
  /** Optional marker shape: "circle", "square", or "triangle" */
  shape?: Shape;
  /** Optional stable identifier carried into the context, not displayed */
  code?: string;
  /** Optional period tag used to select points when `filter.date` is provided */
  date?: string;
}

export interface ScatterChartProps {
  /** Array of points to plot in the cloud */
  dataSet: ScatterDataPoint[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** number / date for x (band x deferred). y is always linear. */
  xAxisDataType?: XaxisDataType;
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Fix the x-axis range instead of deriving it from the data */
  xAxisDomain?: [number, number];
  /** Fix the y-axis range as [min, max] instead of deriving it from the data */
  yAxisDomain?: [number, number];
  /** [minRadius, maxRadius] px for the size scale (default [4, 20]). */
  sizeRange?: [number, number];
  /** Approximate number of axis ticks to generate */
  ticks?: number;
  /** Explicit tick values, overriding the generated ones */
  tickValues?: Array<number | Date>;
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Top-N / sort filter applied to the data before rendering */
  filter?: Filter;
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (d: ScatterDataPoint) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
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
  /** The band category for this row (the x-axis tick); may be null */
  date: string | null;
  /** Numeric segment values keyed by name (string|number); "code" is reserved
   * and excluded from stack keys. */
  [key: string]: string | number | null | undefined;
}

export interface VerticalStackBarDataSet {
  /** Identifier for this group/series; surfaces in the rect provenance and tooltip */
  seriesKey: string;
  /** Short label for the group, shown alongside the key in the default tooltip */
  seriesKeyAbbreviation: string;
  /** The group's rows, one per date, each holding the numeric segment values to stack */
  series: VerticalStackBarDataPoint[];
  /** Optional human-readable name for the group */
  label?: string;
}

/** One stacked segment rect (geometry + provenance). */
export interface StackRectData {
  key: string;
  /** Chart height in pixels */
  height: number;
  /** Chart width in pixels */
  width: number;
  y: number;
  x: number;
  data: VerticalStackBarDataPoint;
  fill: string;
  seriesKey: string;
  seriesKeyAbbreviation: string;
  value: number | null;
  date: string | null;
  /** Optional stable identifier carried into the context (e.g. an ISO code); not displayed */
  code?: string;
  /** true only for missing-data marker stubs (the hasOwnProperty guard path). */
  isMissing?: boolean;
}

export interface StackLegendItem {
  label: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
  color: string;
  order: number;
  disabled?: boolean;
  dataLabelSafe?: string;
}

export interface VerticalStackBarChartProps {
  /** Array of grouped series; each entry contributes its own bar slot per date and stacks its segment keys vertically */
  dataSet: VerticalStackBarDataSet[];
  /** Explicit stack order; present keys first (in this order), natural keys appended. */
  keys?: string[];
  /** Where keys[0] sits in the stack: "topToBottom" (default) puts keys[0] at the top, "bottomToTop" anchors keys[0] at the bottom */
  keysOrder?: "topToBottom" | "bottomToTop";
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Explicit ordered list of date band categories; overrides the auto-collected, sorted set of dates from the data */
  xAxisDomain?: string[];
  /** Fix the y-axis range as [min, max] instead of deriving it from the data */
  yAxisDomain?: [number, number];
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Minimum width in px for each bar slot, floored when bands get narrow (default 5) */
  minBarWidth?: number;
  /** Minimum height in px for a non-zero segment so thin values stay visible (default 15) */
  minBarHeight?: number;
  /** Height in px drawn for an explicit zero-value segment (default 0, i.e. nothing) */
  minBarHeightZero?: number;
  /** Opt-in thin stub on the zero line for explicitly-missing (null/NaN) owned keys. */
  missingDataMarker?: { height: number };
  /** Keep only the top-N dates ranked by grand total across all series and keys: limit caps the count, sortingDir picks highest (desc) or lowest (asc), optional date is the reference date; chronological order is preserved in output */
  filter?: { limit: number; sortingDir: "asc" | "desc"; date?: string };
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (rect: StackRectData) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the computed legend items (label, color, order, disabled, dataLabelSafe) whenever the legend changes */
  onLegendDataChange?: (legendData: StackLegendItem[]) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface StackSeriesContext {
  key: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
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
  /** Row label, shown on the y-axis and used as the color key */
  label: string;
  /** Optional per-row bar color; overrides the generated color mapping for this label */
  color?: string;
  /** The baseline/reference value, drawn as the rear sub-bar */
  valueBased: number;
  /** The comparison value, drawn as the front sub-bar */
  valueCompared: number;
}

export interface ComparableBarChartProps {
  /** Array of horizontal-bar rows; each renders two overlaid sub-bars (valueBased behind, valueCompared in front) for one label */
  dataSet: ComparableBarDataPoint[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Fix the x-axis range instead of deriving it from the data */
  xAxisDomain?: [number, number];
  /** Approximate number of axis ticks to generate */
  ticks?: number;
  /** Width in px reserved for each y-axis (label) tick's HTML (default 100) */
  tickHtmlWidth?: number;
  /** Fill opacity of the two sub-bars (historical look: 0.45 / 0.9). */
  valueBasedOpacity?: number;
  /** Fill opacity of the front valueCompared sub-bar (default 0.9) */
  valueComparedOpacity?: number;
  /** Keep only the top-N labels ranked by the chosen field: limit caps the count, criteria selects "valueBased" or "valueCompared", sortingDir picks highest (desc) or lowest (asc) */
  filter?: { limit: number; criteria: "valueBased" | "valueCompared"; sortingDir: "asc" | "desc" };
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (d: ComparableBarDataPoint) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface ComparableBarSeriesContext {
  label: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
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
  /** Row label, shown on the y-axis and used as the color key */
  label: string;
  /** Optional per-row bar color; overrides the generated color mapping for this label */
  color?: string;
  /** Magnitude of the right-extending bar */
  value1: number;
  /** Magnitude of the left-extending bar */
  value2: number;
}

export interface DualBarChartProps {
  /** Array of diverging (tornado) rows; each row draws value1 as a bar extending right and value2 as a bar extending left from a shared center */
  dataSet: DualBarDataPoint[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Fix the x-axis range instead of deriving it from the data */
  xAxisDomain?: [number, number];
  /** Approximate number of axis ticks to generate */
  ticks?: number;
  /** Width in px reserved for each y-axis (label) tick's HTML (default 100) */
  tickHtmlWidth?: number;
  /** value1 (right) / value2 (left) fill opacities. */
  value1Opacity?: number;
  /** Fill opacity of the left-extending value2 bar (default 0.55) */
  value2Opacity?: number;
  /** Keep only the top-N labels ranked by the chosen field: limit caps the count, criteria selects "value1" or "value2", sortingDir picks highest (desc) or lowest (asc) */
  filter?: { limit: number; criteria: "value1" | "value2"; sortingDir: "asc" | "desc" };
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (d: DualBarDataPoint) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface DualBarSeriesContext {
  label: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
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
  /** The row's category, placed on the band y-axis */
  date: string | number;
  [key: string]: number | string | undefined;
}

export interface BarBellChartProps {
  /** Array of rows (one per date/y-band); within each row the keys are laid out cumulatively along x as thin bars capped by end-cap circles */
  dataSet: BarBellDataRow[];
  /** Ordered segment keys to draw per row; their values accumulate left-to-right and each gets a colored bar plus end-cap circle */
  keys: string[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Explicit [min, max] for the cumulative value (x) axis; overrides the auto domain of [0, max cumulative row total] */
  yAxisDomain?: [number, number];
  /** Approximate number of axis ticks to generate */
  ticks?: number;
  /** Width in px reserved for each y-axis (date) tick's HTML (default 80) */
  tickHtmlWidth?: number;
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (row: BarBellDataRow, key: string, value: number) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface BarBellSeriesContext {
  key: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
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
  /** The x position (number, year, or date string), parsed per xAxisDataType */
  date: number | string;
  /** Lower edge of the band at this x (band y0) */
  valueMin: number;
  /** Upper edge of the band at this x (band y1) */
  valueMax: number;
  /** Optional value for the median line at this x; defaults to the midpoint of valueMin and valueMax when omitted */
  valueMedium?: number;
  /** Optional solid/uncertain flag carried on the shared point shape (consumed by the fan primitive; not rendered by the range band itself) */
  certainty?: boolean;
  /** Explicit provenance: `true` = forecast/projection, `false` = observed/actual. Derives from `certainty === false` when omitted. */
  predicted?: boolean;
  /** Optional per-point label */
  label?: string;
  /** Optional per-point code/identifier */
  code?: string;
}

export interface RangeDataItem {
  /** Series name, used for the legend, tooltip, and color key */
  label: string;
  /** Optional per-series band/line color; overrides the generated color mapping */
  color?: string;
  /** The ordered points defining this series' band over x */
  series: RangeDataPoint[];
}

export interface RangeChartProps {
  /** Array of series, each drawn as a filled valueMin..valueMax band over time with an optional median line */
  dataSet: RangeDataItem[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** How x values are parsed and formatted: yearly dates, monthly dates, or plain numbers */
  xAxisDataType?: XaxisDataType;
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Explicit [min, max] for the value (y) axis; overrides the auto domain derived from the bands */
  yAxisDomain?: [number, number];
  /** Approximate number of axis ticks to generate */
  ticks?: number;
  /** Explicit tick values, overriding the generated ones */
  tickValues?: Array<number | Date>;
  /** Line interpolation: curveLinear, curveMonotoneX, or curveBumpX */
  curve?: CurveType;
  /** band fill opacity (default 0.8). */
  fillOpacity?: number;
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (d: RangeDataPoint, item: RangeDataItem) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface RangeSeriesContext {
  label: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
  color: string;
  pointCount: number;
  minValue: number;
  maxValue: number;
  /** mean band width (valueMax - valueMin) across points. */
  meanRange: number;
  /** count of observed/actual points (provenance: predicted falsy). */
  actualCount: number;
  /** count of forecast/predicted points. */
  predictedCount: number;
  /** x of the first predicted point (forecast boundary), or null when none. */
  forecastStart: number | string | null;
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
  /** The column's band category on the x-axis */
  date: string | number;
  [key: string]: number | string | undefined;
}

export interface RibbonChartProps {
  /** Array of rows (one per date) whose keys stack into a column; same-key segments are linked across adjacent dates by ribbon trapezoids */
  series: RibbonDataRow[];
  /** Ordered segment keys to stack within each column (bottom-to-top) and to connect with ribbons between columns */
  keys: string[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Explicit [min, max] for the value (y) axis; overrides the auto domain from the stacked column totals */
  yAxisDomain?: [number, number];
  /** column width in px (default 30). */
  columnWidth?: number;
  /** Approximate number of axis ticks to generate */
  ticks?: number;
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (row: RibbonDataRow, key: string, value: number) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface RibbonSeriesContext {
  key: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
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

// ---- FountainChart ("Jet d'Eau") ----

/** x-axis modes for the fountain: a temporal/numeric axis = trend, "band" = snapshot. */
export type FountainXAxisType = XaxisDataType | "band";

export interface FountainDataItem {
  /** Series/category name; drives the colour mapping, the data-label hook, and (in snapshot mode) the x-band */
  label: string;
  /** Optional stable identifier carried into the context (e.g. an ISO code); not displayed */
  code?: string;
  /** Primary magnitude: the apex height of the jet, mapped to the y-axis */
  value: number;
  /** Plume bloom half-width at the apex, in the SAME units as value; encodes uncertainty/volatility (0 => a tight spike) */
  spread: number;
  /** Optional sample size / volume; normalised across the dataset to drive froth-layer + droplet density */
  density?: number;
  /** Optional directional bias in [-1, 1]; leans the column like wind (0 = upright, experimental) */
  lean?: number;
  /** Optional explicit colour for this jet, overriding the generated palette colour */
  color?: string;
  /** When false, the jet renders in the dashed/uncertain "forecast" style (default true) */
  certainty?: boolean;
  /** Explicit forecast provenance; preferred over certainty (which detectGaps overloads) */
  predicted?: boolean;
  /** x position for trend mode (year number, epoch ms, or date string); absent => categorical by label */
  date?: number | string;
}

export interface FountainChartProps {
  /** Array of jets; each item renders one fountain */
  dataSet: FountainDataItem[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for jets without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Silhouette style: "jet" (default) is the faithful asymmetric Jet d'Eau (vertical column + wind-blown
   *  diagonal + a triangular droplet spray curtain); "plume" is the symmetric blooming column. */
  style?: "jet" | "plume";
  /** How the x-axis is parsed: a temporal/numeric type renders TREND mode; "band" (or omitted) renders SNAPSHOT mode */
  xAxisDataType?: FountainXAxisType;
  /** Explicit [min, max] for the value (y) axis; overrides the auto domain from value + spread */
  yAxisDomain?: [number, number];
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Approximate number of axis ticks to generate */
  ticks?: number;
  /** Explicit tick values, overriding the generated ones (trend mode) */
  tickValues?: Array<number | Date>;
  /** Number of graduated-opacity froth layers per jet (default 8, max 20); a per-item density overrides it */
  frothLayers?: number;
  /** Exponent in the bloom easing w(h)=stemHalf+spread*(h/H)^p; larger = tighter column, sharper crown (default 3) */
  bloomExponent?: number;
  /** Stem half-width at the base as a fraction of the jet's slot width (default 0.08) */
  stemFraction?: number;
  /** Draw ballistic droplet arcs above each apex (default true) */
  showDroplets?: boolean;
  /** Draw the misty falling skirt around each nozzle (default true) */
  showMist?: boolean;
  /** Draw a connecting line through the apexes in trend mode (default true) */
  showTrendLine?: boolean;
  /** Labels to emphasise; all other jets dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas; getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered jet (sanitized before it is inserted) */
  tooltipFormatter?: (d: FountainDataItem) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (non-finite values, crowding, clipped spread, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface FountainJetContext {
  label: string;
  /** Optional stable identifier carried into the context (e.g. an ISO code); not displayed */
  code?: string;
  color: string;
  value: number;
  spread: number;
  /** value + spread (the upper extent of the plume) */
  upperBound: number;
  /** spread / value, the relative uncertainty (0 when value is 0 and spread is 0) */
  spreadRatio: number;
  predicted: boolean;
  /** x position in trend mode (the raw date/number), or null in snapshot mode */
  xPosition: number | string | null;
}

export interface FountainChartContext extends BaseChartContext {
  chartType: "fountain-chart";
  /** "snapshot" for a categorical/band x, "trend" for a temporal/numeric x */
  mode: "snapshot" | "trend";
  xAxis: { type: FountainXAxisType; domain: string[] | [number, number] };
  yAxis: { domain: [number, number] };
  jets: FountainJetContext[];
  stats: {
    jetCount: number;
    /** The jet with the largest value */
    tallest: { label: string; value: number } | null;
    /** The jet with the largest spread-to-value ratio (most uncertain) */
    frothiest: { label: string; spreadRatio: number } | null;
    /** Slope of a linear regression through the jet values by index (trend mode), else null */
    trendSlope: number | null;
    /** [min, max] of the jet values */
    valueRange: [number, number] | null;
    /** Count of predicted/forecast jets */
    predictedCount: number;
  };
}

// ---- RadarChart (polar) ----

export interface RadarDataItem {
  /** Series name; drives the colour mapping, legend, data-label, and tooltip heading */
  label: string;
  /** Optional explicit colour for this series; otherwise resolved from colorsMapping or the palette */
  color?: string;
  /** one value per axis, aligned to `axes` by index. */
  values: number[];
}

export interface RadarChartProps {
  /** Array of polygon series to plot, one closed shape per item drawn over the shared polar grid */
  series: RadarDataItem[];
  /** spoke labels (the radial axes). */
  axes: string[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Value mapped to the outer ring (full radius), shared by every spoke; defaults to the largest value across all series and axes (or 1 when all are zero) */
  maxValue?: number;
  /** number of concentric grid rings (default 4). */
  rings?: number;
  /** polygon fill opacity (default 0.2). */
  fillOpacity?: number;
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (item: RadarDataItem) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface RadarSeriesContext {
  label: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
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
// ---- FanChart (forecast fan: a line + dashed median + nested confidence bands) ----
// Composes the Line + Range primitives (no bespoke geometry): the `series` is a
// LineChart series (history `certainty:true`, forecast median `certainty:false` →
// dashed), and `bands` are RangeChart valueMin..valueMax bands drawn underneath with
// graduated opacity. Same prop surface as LineChart so it feels familiar.

/** One nested confidence band of a fan (e.g. the 80% interval). */
export interface FanBand {
  /** confidence level in (0,1), e.g. 0.8. */
  level: number;
  /** Per-x band extents (valueMin..valueMax, optional valueMedium) defining this confidence interval over time */
  series: RangeDataPoint[];
}

export interface FanDataItem {
  /** Series name; drives the colour mapping, line, band fills, and tooltip heading */
  label: string;
  /** Optional explicit colour shared by this series' line and all its bands; otherwise resolved from colorsMapping or the palette */
  color?: string;
  /** the line: history (certainty:true) then forecast median (certainty:false). */
  series: DataPoint[];
  /** nested confidence bands; engine draws widest-first so narrower sit on top. */
  bands: FanBand[];
}

export interface FanChartProps {
  /** Array of forecast series, each a median line plus its nested confidence bands */
  dataSet: FanDataItem[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Fixed [min, max] for the y-axis; when omitted the domain auto-fits the line plus the widest band extents */
  yAxisDomain?: [number, number];
  /** How x values are parsed and formatted: yearly dates, monthly dates, or plain numbers */
  xAxisDataType?: XaxisDataType;
  /** Formats an x tick value into its display label */
  xAxisFormat?: (d: number | string) => string;
  /** Formats a y tick value into its display label */
  yAxisFormat?: (d: number | string) => string;
  /** Approximate number of axis ticks to generate */
  ticks?: number;
  /** Explicit tick values, overriding the generated ones */
  tickValues?: Array<number | Date>;
  /** Line interpolation: curveLinear, curveMonotoneX, or curveBumpX */
  curve?: CurveType;
  /** band fill opacity for the widest band (narrower bands scale up from here). */
  fillOpacity?: number;
  /** shade the forecast region (from the last solid point to the end). Default true. */
  forecastZone?: boolean;
  /** Draw a marker at each median data point (default false) */
  showDataPoints?: boolean;
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Custom HTML for the tooltip (DOMPurify-sanitized; may include `<a href>` links). */
  tooltipFormatter?: (item: FanDataItem, lastPoint: DataPoint | null) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface FanSeriesContext {
  label: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
  color: string;
  pointCount: number;
  /** count of solid (certainty:true) history points. */
  historyCount: number;
  /** count of dashed (certainty:false) forecast points. */
  forecastCount: number;
  /** x of the first predicted point (where history ends and the forecast begins), or null. */
  forecastStart: number | string | null;
  /** last median point (the end of the forecast). */
  last: { x: number | string; y: number } | null;
  /** confidence levels present, ascending. */
  bandLevels: number[];
  /** band half-width at the final forecast point for the widest level, or null. */
  finalUncertainty: number | null;
}

export interface FanChartContext extends BaseChartContext {
  chartType: "fan-chart";
  xAxis: { type: XaxisDataType; domain: [number, number] };
  yAxis: { domain: [number, number] };
  series: FanSeriesContext[];
  stats: { seriesCount: number; forecastHorizon: number };
}

// ---- TreemapChart (hierarchical squarified tiling; optional two-part split per leaf) ----
// Each leaf's rect is sized by `value`; an optional `partial` sub-value splits the rect into a
// solid primary part (width = partial/value) and a lighter remainder. The two parts are named by a
// configurable `splitLabels` (e.g. ["Realized","Untapped"]) — nothing here hardcodes domain words.
// Parents render as padded containers with a header label. Generic "part-of-a-total in a tile".

export interface TreemapNode {
  /** Node name (drives data-label, the colour group, legend, and the leaf label). */
  label: string;
  /** Optional identifier carried through to the leaf context and tooltip */
  code?: string;
  /** Leaf size; for a parent the value is derived as the sum of its children. */
  value?: number;
  /** Emphasized sub-portion of a leaf (0..value); remainder = value - partial. Omit for single-fill. */
  partial?: number;
  /** Optional explicit colour; on a top-level node it seeds the colour for that whole group */
  color?: string;
  /** Child nodes making this a parent (container) tile; presence of any children makes the chart nested */
  children?: TreemapNode[];
}

export interface TreemapChartProps {
  /** Forest of nodes (each a leaf or a parent with children) sized by value and tiled to fill the area */
  dataSet: TreemapNode[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Gap between sibling tiles in px (default 1). */
  paddingInner?: number;
  /** Header strip height (px) reserved on parent tiles for their label in nested mode (default 18). */
  paddingTop?: number;
  /** Layout algorithm: "squarify" (treemap, default), "stack" (single-column, mobile-friendly),
   * or "auto" (stack below `stackBreakpoint` width). */
  layout?: "squarify" | "stack" | "auto";
  /** Width (px) below which `layout: "auto"` switches to the stack layout (default 480). */
  stackBreakpoint?: number;
  /** Names of the two split parts (default ["Filled","Remaining"]). */
  splitLabels?: [string, string];
  /** Apparent colour strength of the remainder/untapped segment in [0,1] (default 0.35).
   * Rendered as the solid colour under a white veil, so it reads as a lighter tint of the
   * same hue on any background (light or dark) rather than depending on the backdrop. */
  splitOpacity?: number;
  /** Render the primary/remainder split. Defaults to auto-on when any leaf carries `partial`. */
  showSplit?: boolean;
  /** Render a 2-swatch split legend (uses splitLabels). */
  showLegend?: boolean;
  /** Floor each leaf's tiling area to this percent of the largest leaf, so tiny tiles stay visible. */
  minTileShare?: number;
  /** Keep only the top-N leaves by value. */
  filter?: { limit: number; sortingDir: "asc" | "desc" };
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Formats numeric values shown in the default tooltip (defaults to a locale number formatter) */
  valueFormatter?: (n: number) => string;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (leaf: TreemapLeafContext) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface TreemapLeafContext {
  label: string;
  /** Optional stable identifier carried into the context (e.g. an ISO code); not displayed */
  code?: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
  color: string;
  /** Path from the top-level group to this leaf, e.g. ["Sectors","Coffee"]. */
  path: string[];
  value: number;
  partial: number | null;
  remainder: number | null;
  /** partial / value in [0,1], or null when there's no split. */
  partialPct: number | null;
}

export interface TreemapChartContext extends BaseChartContext {
  chartType: "treemap-chart";
  /** The layout actually used to place the tiles (after resolving "auto"). */
  layout: "squarify" | "stack";
  splitLabels: [string, string];
  leaves: TreemapLeafContext[];
  /** Maximum nesting depth (1 = flat). */
  depth: number;
  stats: {
    leafCount: number;
    grandTotal: number;
    totalPartial: number | null;
    totalRemainder: number | null;
    largestLeaf: { label: string; value: number } | null;
    /** Leaf with the biggest remainder (e.g. the largest untapped opportunity). */
    largestRemainder: { label: string; remainder: number } | null;
  };
}

// ---- PieChart (pie + donut) ----
// One engine renders both: `innerRadiusRatio` 0 = solid pie, >0 = donut hole as a
// fraction of the outer radius. Slices are sized by value (a part-of-a-whole share).

export interface PieDataItem {
  /** Slice name (drives data-label, the colour, the legend, and the label). */
  label: string;
  /** Optional stable identifier carried into the context (e.g. an ISO code); not displayed */
  code?: string;
  /** Slice size (>= 0; negatives/non-finite are clamped to 0). */
  value: number;
  /** Optional explicit colour for this item, overriding the generated palette colour */
  color?: string;
}

export interface PieChartProps {
  /** Array of slices; each value becomes a wedge sized by its share of the total */
  dataSet: PieDataItem[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** 0 = full pie (default); (0,1) = donut hole as a fraction of the outer radius. */
  innerRadiusRatio?: number;
  /** Gap between slices in radians (default 0). */
  padAngle?: number;
  /** Corner radius on the arcs in px (default 0). */
  cornerRadius?: number;
  /** Sort slices by value descending (default true); false keeps data order. */
  sortByValue?: boolean;
  /** Draw the % label inside each slice when it is large enough (default true). */
  showLabels?: boolean;
  /** Render a swatch+label legend below the chart (default false). */
  showLegend?: boolean;
  /** Keep only the top-N slices by value. */
  filter?: { limit: number; sortingDir: "asc" | "desc" };
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Formats a numeric value for labels and tooltips */
  valueFormatter?: (n: number) => string;
  /** Returns custom tooltip HTML for a hovered datum (sanitized before it is inserted) */
  tooltipFormatter?: (slice: PieSliceContext) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface PieSliceContext {
  label: string;
  /** Optional stable identifier carried into the context (e.g. an ISO code); not displayed */
  code?: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
  color: string;
  value: number;
  /** value / total in [0,1]. */
  share: number;
  /** Radians, clockwise from 12 o'clock. */
  startAngle: number;
  endAngle: number;
}

export interface PieChartContext extends BaseChartContext {
  chartType: "pie-chart";
  /** "pie" when innerRadiusRatio === 0, else "donut". */
  mode: "pie" | "donut";
  innerRadiusRatio: number;
  slices: PieSliceContext[];
  stats: {
    sliceCount: number;
    total: number;
    largestSlice: { label: string; value: number; share: number } | null;
  };
}

// ---- BubbleChart (gravity-packed bubbles) ----
// Circles sized by value (area ∝ value) and clustered by a force simulation
// (gravity toward centre + collision), so they nestle together. Each bubble may
// carry an optional realized/untapped split drawn as a lighter outer veil.

export interface BubbleDataItem {
  /** Bubble name (drives data-label, the colour, the legend, and the label). */
  label: string;
  /** Optional stable identifier carried into the context (e.g. an ISO code); not displayed */
  code?: string;
  /** Bubble size (area ∝ value; >= 0). */
  value: number;
  /** Realized sub-portion in [0,value]; drawn as a solid core inside a lighter
   * veil. Omit for a single-fill bubble. */
  partial?: number;
  /** Optional explicit colour for this item, overriding the generated palette colour */
  color?: string;
}

export interface BubbleChartProps {
  /** Array of bubbles; each value sets the circle area (bubbles are gravity-packed into a cluster) */
  dataSet: BubbleDataItem[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Strength of the pull toward the centre in [0,1] (default 0.09) — higher =
   * tighter cluster ("suck together"). */
  gravity?: number;
  /** Many-body charge: negative repels, positive attracts (default 0). */
  chargeStrength?: number;
  /** Gap between packed circles in px (default 2). */
  padding?: number;
  /** Fraction of the plot area the bubbles should fill, in (0,1] (default 0.62). */
  fillRatio?: number;
  /** Names of the two split parts (default ["Realized","Untapped"]). */
  splitLabels?: [string, string];
  /** Apparent colour strength of the untapped veil in [0,1] (default 0.35);
   * rendered as solid colour under a white veil so it reads as a lighter tint of
   * the same hue on any background. */
  splitOpacity?: number;
  /** Render the realized/untapped split. Defaults to auto-on when any item has `partial`. */
  showSplit?: boolean;
  /** Render a 2-swatch split legend (uses splitLabels). */
  showLegend?: boolean;
  /** Draw the label inside each bubble when it is large enough (default true). */
  showLabels?: boolean;
  /** Keep only the top-N bubbles by value. */
  filter?: { limit: number; sortingDir: "asc" | "desc" };
  /** Labels to emphasise; all other marks dim */
  highlightItems?: string[];
  /** Labels to hide and exclude from scales/stacks */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Formats a numeric value for labels and tooltips */
  valueFormatter?: (n: number) => string;
  /** Returns custom tooltip HTML for a hovered datum/mark (sanitized before it is inserted) */
  tooltipFormatter?: (bubble: BubbleContext) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface BubbleContext {
  label: string;
  /** Optional stable identifier carried into the context (e.g. an ISO code); not displayed */
  code?: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
  color: string;
  value: number;
  partial: number | null;
  remainder: number | null;
  /** partial / value in [0,1], or null when there's no split. */
  partialPct: number | null;
}

export interface BubbleChartContext extends BaseChartContext {
  chartType: "bubble-chart";
  splitLabels: [string, string];
  bubbles: BubbleContext[];
  stats: {
    bubbleCount: number;
    total: number;
    totalPartial: number | null;
    totalRemainder: number | null;
    largestBubble: { label: string; value: number } | null;
    /** Bubble with the biggest remainder (e.g. the largest untapped opportunity). */
    largestRemainder: { label: string; remainder: number } | null;
  };
}

// ---- SankeyChart (flow diagram) ----
// Nodes laid out in columns (left-to-right) with links whose width is proportional
// to the flow value, via d3-sankey. Generic "where does the flow go" diagram.

export interface SankeyNodeItem {
  /** Unique node id (links reference this). */
  id: string;
  /** Display label (defaults to id). */
  label?: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
  color?: string;
}

export interface SankeyLinkItem {
  /** Source node id. */
  source: string;
  /** Target node id. */
  target: string;
  /** Flow magnitude (> 0). */
  value: number;
}

export interface SankeyChartProps {
  /** Flow nodes; each needs a unique id that links reference */
  nodes: SankeyNodeItem[];
  /** Directed flows between nodes (source -> target); band thickness is proportional to value */
  links: SankeyLinkItem[];
  /** Optional chart title rendered above the plot */
  title?: string;
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Inner margins (top/right/bottom/left, in px) reserved for axes, titles, and labels */
  margin?: Margin;
  /** Categorical palette for series/labels without an explicit colour or colorsMapping entry */
  colors?: string[];
  /** Explicit label -> colour map; takes precedence over the palette and per-item colours */
  colorsMapping?: Record<string, string>;
  /** Node rect width in px (default 18). */
  nodeWidth?: number;
  /** Vertical gap between nodes in a column in px (default 12). */
  nodePadding?: number;
  /** Corner radius of the node rects in px (default 2; 0 = square corners).
   * Clamped to half the node's shorter side. */
  nodeRadius?: number;
  /** Corner radius (px) of the filled flow ribbons where they meet the nodes
   * (default 2; 0 = sharp corners). Clamped to half the band's thickness. */
  linkRadius?: number;
  /** Colour links by their "source" (default) or "target" node. */
  linkColorMode?: "source" | "target";
  /** Link opacity in [0,1] (default 0.45). */
  linkOpacity?: number;
  /** Draw node labels (default true). */
  showLabels?: boolean;
  /** Node ids to highlight (links to/from a highlighted node stay lit). */
  highlightItems?: string[];
  /** Node ids to drop (their links are dropped too). */
  disabledItems?: string[];
  /** Render as inline SVG (default) or to a canvas (faster for large datasets); getContext() is identical either way */
  renderer?: "svg" | "canvas";
  /** BCP-47 locale used for number and date formatting */
  locale?: string;
  /** External-CSS mode: unmapped labels resolve to transparent and onColorMappingGenerated is not emitted, so mark colours come from your CSS via the data-label-safe contract */
  skipColorMappingDispatch?: boolean;
  /** Animate updates with CSS transitions (default true) */
  enableTransitions?: boolean;
  /** Formats a numeric value for labels and tooltips */
  valueFormatter?: (n: number) => string;
  /** Returns custom tooltip HTML for a hovered datum/mark (sanitized before it is inserted) */
  tooltipFormatter?: (mark: SankeyNodeContext | SankeyLinkContext) => string;
  /** Called when the hovered/highlighted label(s) change */
  onHighlightItem?: (labels: string[]) => void;
  /** Called with the resolved label -> colour map after the chart assigns colours */
  onColorMappingGenerated?: (mapping: Record<string, string>) => void;
  /** Called with the renderer-agnostic ChartContext whenever the data is (re)processed */
  onChartDataProcessed?: (context: ChartContext) => void;
  /** Called with any non-fatal data warnings (duplicate labels, non-finite values, gaps, ...) */
  onDataWarning?: (warnings: DataWarning[]) => void;
}

export interface SankeyNodeContext {
  kind: "node";
  id: string;
  label: string;
  /** Optional explicit colour for this item, overriding the generated palette colour */
  color: string;
  /** Total flow through the node (max of its in/out flow). */
  value: number;
  /** Column index (0 = leftmost). */
  depth: number;
}

export interface SankeyLinkContext {
  kind: "link";
  source: string;
  target: string;
  value: number;
  /** Optional explicit colour for this item, overriding the generated palette colour */
  color: string;
}

export interface SankeyChartContext extends BaseChartContext {
  chartType: "sankey-chart";
  nodes: SankeyNodeContext[];
  links: SankeyLinkContext[];
  stats: {
    nodeCount: number;
    linkCount: number;
    columnCount: number;
    /** Sum of all link values. */
    totalFlow: number;
    largestLink: { source: string; target: string; value: number } | null;
    busiestNode: { id: string; value: number } | null;
  };
}

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
  | RadarChartContext
  | FanChartContext
  | TreemapChartContext
  | PieChartContext
  | BubbleChartContext
  | SankeyChartContext
  | FountainChartContext;

export interface DataWarning {
  type:
    | "non-finite-value"
    | "duplicate-label"
    | "difference-mismatch"
    | "empty-dataset"
    | "non-monotonic-date"
    | "duplicate-date"
    | "layout-overflow";
  message: string;
  label?: string;
}

// ---- Engine instance ----

export interface ChartInstance<P> {
  update(props: P): void;
  getContext(): ChartContext | null;
  destroy(): void;
  /** Register an insights plugin after mount (engines that support plugins). */
  use?(plugin: import("./plugins/types").MichiVzPlugin<P>): void;
  /** Collected agent/MCP tools from registered plugins. */
  getTools?(): import("./plugins/types").AgentTool[];
}

/** Optional 3rd arg to every `mountXxxChart` for opt-in plugins. */
export interface MountOptions<P> {
  plugins?: Array<import("./plugins/types").MichiVzPlugin<P>>;
}
