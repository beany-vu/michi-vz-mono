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

export interface ChartContext {
  chartType: "gap-chart";
  title?: string;
  renderer: "svg" | "canvas";
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
  colorsMapping: Record<string, string>;
  /** Deterministic, rule-based natural-language summary. No model required;
   * doubles as accessibility alt text. */
  summary: string;
}

export interface DataWarning {
  type:
    | "non-finite-value"
    | "duplicate-label"
    | "difference-mismatch"
    | "empty-dataset";
  message: string;
  label?: string;
}

// ---- Engine instance ----

export interface ChartInstance<P> {
  update(props: P): void;
  getContext(): ChartContext | null;
  destroy(): void;
}
