// <michi-vz-gap-chart> - native web component (Lit, LIGHT DOM) over the
// @michi-vz/core engine. Light DOM (createRenderRoot returns `this`) preserves
// the consumer colour contract + canvas probe. We let Lit render a single stable
// host <div> and mount the imperative engine into it; Lit's diff keeps that div
// (and the engine's children) across updates. No decorators - keeps tsup/esbuild
// builds simple.
import { LitElement, html, type PropertyValues } from "lit";
import { mountGapChart } from "@michi-vz/core";
import type {
  AgentTool,
  GapChartProps,
  GapDataItem,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
  Shape,
  XaxisDataType,
  Margin,
  ShapeMapping,
  Filter,
  TimelinePeriodConfig,
  TimelineController,
} from "@michi-vz/core";

export class GapChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    xAxisDataType: { type: String, attribute: "x-axis-data-type" },
    xAxisDomain: { attribute: false },
    interactiveRowLabels: { type: Boolean, attribute: "interactive-row-labels" },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    shapeValue1: { type: String, attribute: "shape-value1" },
    shapeValue2: { type: String, attribute: "shape-value2" },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
    margin: { attribute: false },
    colors: { attribute: false },
    colorMode: { type: String, attribute: "color-mode" },
    shapeColorsMapping: { attribute: false },
    shapesLabelsMapping: { attribute: false },
    filter: { attribute: false },
    timeline: { attribute: false },
    xAxisFormat: { attribute: false },
    yAxisFormat: { attribute: false },
    ticks: { type: Number },
    tickValues: { attribute: false },
    enableExplicitTickValues: { type: Boolean, attribute: "enable-explicit-tick-values" },
    tickHtmlWidth: { type: Number, attribute: "tick-html-width" },
    squareRadius: { type: Number, attribute: "square-radius" },
    showLegend: { type: Boolean, attribute: "show-legend" },
    legendAlign: { type: String, attribute: "legend-align" },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
    isLoading: { type: Boolean, attribute: "is-loading" },
    isNodata: { attribute: false },
    noDataLabel: { type: String, attribute: "no-data-label" },
    showZeroLineForXAxis: { type: Boolean, attribute: "show-zero-line-for-x-axis" },
    maxBarHeight: { type: Number, attribute: "max-bar-height" },
  };

  dataSet: GapDataItem[] = [];
  chartTitle = "";
  width = 1000;
  height = 500;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  xAxisDataType: XaxisDataType = "number";
  xAxisDomain?: [number, number];
  interactiveRowLabels?: boolean;
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  shapeValue1: Shape = "circle";
  shapeValue2: Shape = "circle";
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: GapDataItem) => string;
  plugins?: MichiVzPlugin<GapChartProps>[];
  locale?: string;
  margin?: Margin;
  colors?: string[];
  colorMode?: "label" | "shape";
  shapeColorsMapping?: ShapeMapping;
  shapesLabelsMapping?: ShapeMapping;
  filter?: Filter;
  timeline?: boolean | TimelinePeriodConfig;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  ticks?: number;
  tickValues?: Array<number | Date>;
  enableExplicitTickValues?: boolean;
  tickHtmlWidth?: number;
  squareRadius?: number;
  showLegend?: boolean;
  legendAlign?: "left" | "center" | "right";
  enableTransitions?: boolean;
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: GapDataItem[] | null | undefined) => boolean);
  noDataLabel?: string;
  showZeroLineForXAxis?: boolean;
  maxBarHeight?: number;

  private chart?: ChartInstance<GapChartProps>;

  // Light DOM so consumer CSS reaches the marks (the colour contract).
  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): GapChartProps {
    return {
      dataSet: this.dataSet,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      xAxisDataType: this.xAxisDataType,
      xAxisDomain: this.xAxisDomain,
      interactiveRowLabels: this.interactiveRowLabels,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      shapeValue1: this.shapeValue1,
      shapeValue2: this.shapeValue2,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      locale: this.locale,
      margin: this.margin,
      colors: this.colors,
      colorMode: this.colorMode,
      shapeColorsMapping: this.shapeColorsMapping,
      shapesLabelsMapping: this.shapesLabelsMapping,
      filter: this.filter,
      timeline: this.timeline,
      xAxisFormat: this.xAxisFormat,
      yAxisFormat: this.yAxisFormat,
      ticks: this.ticks,
      tickValues: this.tickValues,
      enableExplicitTickValues: this.enableExplicitTickValues,
      tickHtmlWidth: this.tickHtmlWidth,
      squareRadius: this.squareRadius,
      showLegend: this.showLegend,
      legendAlign: this.legendAlign,
      enableTransitions: this.enableTransitions,
      isLoading: this.isLoading,
      isNodata: this.isNodata,
      noDataLabel: this.noDataLabel,
      showZeroLineForXAxis: this.showZeroLineForXAxis,
      maxBarHeight: this.maxBarHeight,
      onHighlightItem: (item) => this.emit("michi-vz:highlight", item),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host) this.chart = mountGapChart(host, this.chartProps, { plugins: this.plugins });
  }

  protected updated(_changed: PropertyValues): void {
    this.chart?.update(this.chartProps);
  }

  disconnectedCallback(): void {
    this.chart?.destroy();
    this.chart = undefined;
    super.disconnectedCallback();
  }

  /** Renderer-agnostic semantic snapshot (works in SVG and canvas mode). */
  getContext(): ChartContext | null {
    return this.chart?.getContext() ?? null;
  }

  getTools(): AgentTool[] {
    return this.chart?.getTools?.() ?? [];
  }

  /** Headless playback controller (null unless the `timeline` prop is set). */
  getTimeline(): TimelineController | null {
    return this.chart?.timeline?.() ?? null;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-gap-chart")) {
  customElements.define("michi-vz-gap-chart", GapChartElement);
}
