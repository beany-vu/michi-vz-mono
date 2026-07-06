// <michi-vz-scatter-chart> - native web component (Lit, LIGHT DOM) over the
// @michi-vz/core ScatterPlot engine. Same pattern as the other elements.
import { LitElement, html, type PropertyValues } from "lit";
import { mountScatterChart } from "@michi-vz/core";
import type {
  AgentTool,
  ScatterChartProps,
  ScatterDataPoint,
  ScatterPointLabelsConfig,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
  XaxisDataType,
  Margin,
  Filter,
} from "@michi-vz/core";

export class ScatterChartElement extends LitElement {
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
    sizeRange: { attribute: false },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
    margin: { attribute: false },
    colors: { attribute: false },
    xAxisFormat: { attribute: false },
    yAxisFormat: { attribute: false },
    xAxisDomain: { attribute: false },
    yAxisDomain: { attribute: false },
    ticks: { type: Number },
    tickValues: { attribute: false },
    filter: { attribute: false },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
    isLoading: { type: Boolean, attribute: "is-loading" },
    isNodata: { attribute: false },
    noDataLabel: { type: String, attribute: "no-data-label" },
    showCrosshair: { type: Boolean, attribute: "show-crosshair" },
    crosshairLabels: { type: Boolean, attribute: "crosshair-labels" },
    crosshairLineStyle: { type: String, attribute: "crosshair-line-style" },
    crosshairSpan: { type: String, attribute: "crosshair-span" },
    crosshairLabelPlacement: { type: String, attribute: "crosshair-label-placement" },
    dScaleLegend: { attribute: false },
    yTicksQty: { type: Number, attribute: "y-ticks-qty" },
    showGrid: { attribute: false },
    pinIcon: { type: Boolean, attribute: "pin-icon" },
    svgChildren: { type: String, attribute: "svg-children" },
    pointLabels: { attribute: false },
    drawOrder: { type: String, attribute: "draw-order" },
  };

  dataSet: ScatterDataPoint[] = [];
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  xAxisDataType: XaxisDataType = "number";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  sizeRange?: [number, number];
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: ScatterDataPoint) => string;
  plugins?: MichiVzPlugin<ScatterChartProps>[];
  locale?: string;
  margin?: Margin;
  colors?: string[];
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  xAxisDomain?: [number, number] | string[];
  yAxisDomain?: [number, number];
  ticks?: number;
  tickValues?: Array<number | Date>;
  filter?: Filter;
  enableTransitions?: boolean;
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: ScatterDataPoint[] | null | undefined) => boolean);
  noDataLabel?: string;
  showCrosshair?: boolean;
  crosshairLabels?: boolean;
  crosshairLineStyle?: "solid" | "dashed";
  crosshairSpan?: "full" | "half";
  crosshairLabelPlacement?: "auto" | "fixed";
  dScaleLegend?: { title?: string; valueFormatter?: (d: number) => string };
  yTicksQty?: number;
  showGrid?: boolean | { x?: boolean; y?: boolean };
  pinIcon?: boolean;
  svgChildren?: string;
  pointLabels?: boolean | ScatterPointLabelsConfig;
  drawOrder?: "none" | "sizeDescending";

  private chart?: ChartInstance<ScatterChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): ScatterChartProps {
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
      sizeRange: this.sizeRange,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      locale: this.locale,
      margin: this.margin,
      colors: this.colors,
      xAxisFormat: this.xAxisFormat,
      yAxisFormat: this.yAxisFormat,
      xAxisDomain: this.xAxisDomain,
      yAxisDomain: this.yAxisDomain,
      ticks: this.ticks,
      tickValues: this.tickValues,
      filter: this.filter,
      enableTransitions: this.enableTransitions,
      isLoading: this.isLoading,
      isNodata: this.isNodata,
      noDataLabel: this.noDataLabel,
      showCrosshair: this.showCrosshair,
      crosshairLabels: this.crosshairLabels,
      crosshairLineStyle: this.crosshairLineStyle,
      crosshairSpan: this.crosshairSpan,
      crosshairLabelPlacement: this.crosshairLabelPlacement,
      dScaleLegend: this.dScaleLegend,
      yTicksQty: this.yTicksQty,
      showGrid: this.showGrid,
      pinIcon: this.pinIcon,
      svgChildren: this.svgChildren,
      pointLabels: this.pointLabels,
      drawOrder: this.drawOrder,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host) this.chart = mountScatterChart(host, this.chartProps, { plugins: this.plugins });
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
}

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-scatter-chart")) {
  customElements.define("michi-vz-scatter-chart", ScatterChartElement);
}
