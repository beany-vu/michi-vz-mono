// <michi-vz-line-chart> - native web component (Lit, LIGHT DOM) over the
// @michi-vz/core LineChart engine. Same shape as <michi-vz-gap-chart>: light DOM
// preserves the consumer colour contract + canvas probe; no decorators; mounts
// the imperative engine into a stable host <div>.
import { LitElement, html, type PropertyValues } from "lit";
import { mountLineChart } from "@michi-vz/core";
import type {
  AgentTool,
  LineChartProps,
  LineDataItem,
  DataPoint,
  CurveType,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
  XaxisDataType,
  SinglePointLineConfig,
  MouseLineConfig,
  ProgressiveDrawConfig,
  Margin,
  Filter,
} from "@michi-vz/core";

export class LineChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    xAxisDataType: { type: String, attribute: "x-axis-data-type" },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    curve: { type: String },
    detectGaps: { type: Boolean, attribute: "detect-gaps" },
    expectedStep: { type: Number, attribute: "expected-step" },
    showDataPoints: { type: Boolean, attribute: "show-data-points" },
    enableMouseLine: { type: Boolean, attribute: "enable-mouse-line" },
    singlePointLine: { attribute: false },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    sharedTooltip: { type: Boolean, attribute: "shared-tooltip" },
    sharedTooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
    yTicks: { type: Number, attribute: "y-ticks" },
    showGridLines: { type: Boolean, attribute: "show-grid-lines" },
    showVerticalGridLines: { type: Boolean, attribute: "show-vertical-grid-lines" },
    highlightZeroLine: { type: Boolean, attribute: "highlight-zero-line" },
    fontFamily: { type: String, attribute: "font-family" },
    isLoading: { type: Boolean, attribute: "is-loading" },
    isNodata: { attribute: false },
    noDataLabel: { type: String, attribute: "no-data-label" },
    margin: { attribute: false },
    colors: { attribute: false },
    yAxisDomain: { attribute: false },
    yAxisScale: { type: String, attribute: "y-axis-scale" },
    xAxisFormat: { attribute: false },
    yAxisFormat: { attribute: false },
    ticks: { type: Number },
    tickValues: { attribute: false },
    fillPeriodTicks: { type: Boolean, attribute: "fill-period-ticks" },
    noDataTickTooltip: { attribute: false },
    noDataTickColor: { type: String, attribute: "no-data-tick-color" },
    filter: { attribute: false },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
    progressiveDraw: { attribute: false },
    svgChildren: { type: String, attribute: "svg-children" },
  };

  dataSet: LineDataItem[] = [];
  chartTitle = "";
  width = 1000;
  height = 500;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  xAxisDataType: XaxisDataType = "number";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  curve?: CurveType;
  detectGaps = false;
  expectedStep?: number;
  showDataPoints = false;
  // No initializer: core defaults it to TRUE (legacy parity); the boolean attribute
  // still opts in explicitly, and a MouseLineConfig object arrives via property.
  enableMouseLine?: boolean | MouseLineConfig;
  singlePointLine?: boolean | SinglePointLineConfig;
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: DataPoint, series: DataPoint[], dataSet: LineDataItem[]) => string;
  sharedTooltip = false;
  sharedTooltipFormatter?: (input: {
    x: number | string;
    xLabel: string;
    entries: Array<{ label: string; value: number; color: string; d: DataPoint }>;
  }) => string;
  plugins?: MichiVzPlugin<LineChartProps>[];
  locale?: string;
  yTicks?: number;
  showGridLines?: boolean;
  showVerticalGridLines?: boolean;
  highlightZeroLine?: boolean;
  fontFamily?: string;
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: LineDataItem[] | null | undefined) => boolean);
  noDataLabel?: string;
  margin?: Margin;
  colors?: string[];
  yAxisDomain?: [number, number];
  yAxisScale?: "linear" | "log";
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  ticks?: number;
  tickValues?: Array<number | Date>;
  fillPeriodTicks?: boolean;
  noDataTickTooltip?: (date: number) => string;
  noDataTickColor?: string;
  filter?: Filter;
  enableTransitions?: boolean;
  progressiveDraw?: boolean | ProgressiveDrawConfig;
  svgChildren?: string;

  private chart?: ChartInstance<LineChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): LineChartProps {
    return {
      dataSet: this.dataSet,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      xAxisDataType: this.xAxisDataType,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      curve: this.curve,
      detectGaps: this.detectGaps,
      expectedStep: this.expectedStep,
      showDataPoints: this.showDataPoints,
      enableMouseLine: this.enableMouseLine,
      singlePointLine: this.singlePointLine,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      sharedTooltip: this.sharedTooltip,
      sharedTooltipFormatter: this.sharedTooltipFormatter,
      locale: this.locale,
      yTicks: this.yTicks,
      showGridLines: this.showGridLines,
      showVerticalGridLines: this.showVerticalGridLines,
      highlightZeroLine: this.highlightZeroLine,
      fontFamily: this.fontFamily,
      isLoading: this.isLoading,
      isNodata: this.isNodata,
      noDataLabel: this.noDataLabel,
      margin: this.margin,
      colors: this.colors,
      yAxisDomain: this.yAxisDomain,
      yAxisScale: this.yAxisScale,
      xAxisFormat: this.xAxisFormat,
      yAxisFormat: this.yAxisFormat,
      ticks: this.ticks,
      tickValues: this.tickValues,
      fillPeriodTicks: this.fillPeriodTicks,
      noDataTickTooltip: this.noDataTickTooltip,
      noDataTickColor: this.noDataTickColor,
      filter: this.filter,
      enableTransitions: this.enableTransitions,
      progressiveDraw: this.progressiveDraw,
      svgChildren: this.svgChildren,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host) this.chart = mountLineChart(host, this.chartProps, { plugins: this.plugins });
  }

  protected updated(_changed: PropertyValues): void {
    this.chart?.update(this.chartProps);
  }

  disconnectedCallback(): void {
    this.chart?.destroy();
    this.chart = undefined;
    super.disconnectedCallback();
  }

  getContext(): ChartContext | null {
    return this.chart?.getContext() ?? null;
  }

  getTools(): AgentTool[] {
    return this.chart?.getTools?.() ?? [];
  }

  /** Re-run the progressiveDraw reveal animation (no-op unless the prop is set). */
  replay(): void {
    this.chart?.replay?.();
  }
}

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-line-chart")) {
  customElements.define("michi-vz-line-chart", LineChartElement);
}
