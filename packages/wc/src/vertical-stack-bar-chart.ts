// <michi-vz-vertical-stack-bar-chart> — native web component (Lit, LIGHT DOM)
// over the @michi-vz/core VerticalStackBar engine.
import { LitElement, html, type PropertyValues } from "lit";
import { mountVerticalStackBarChart } from "@michi-vz/core";
import type {
  AgentTool,
  VerticalStackBarChartProps,
  VerticalStackBarDataSet,
  StackTooltipData,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
  Margin,
} from "@michi-vz/core";

export class VerticalStackBarChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    keys: { attribute: false },
    keysOrder: { type: String, attribute: "keys-order" },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    missingDataMarker: { attribute: false },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
    margin: { attribute: false },
    xAxisLabelPadding: { type: Number, attribute: "x-axis-label-padding" },
    xAxisMode: { type: String, attribute: "x-axis-mode" },
    xAxisFormat: { attribute: false },
    yAxisFormat: { attribute: false },
    xAxisDomain: { attribute: false },
    yAxisDomain: { attribute: false },
    colors: { attribute: false },
    minBarWidth: { type: Number, attribute: "min-bar-width" },
    minBarHeight: { type: Number, attribute: "min-bar-height" },
    minBarHeightZero: { type: Number, attribute: "min-bar-height-zero" },
    filter: { attribute: false },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
    isLoading: { type: Boolean, attribute: "is-loading" },
    isNodata: { attribute: false },
    noDataLabel: { type: String, attribute: "no-data-label" },
    fontFamily: { type: String, attribute: "font-family" },
    yTicks: { type: Number, attribute: "y-ticks" },
    showGridLines: { type: Boolean, attribute: "show-grid-lines" },
    highlightZeroLine: { type: Boolean, attribute: "highlight-zero-line" },
  };

  dataSet: VerticalStackBarDataSet[] = [];
  keys?: string[];
  keysOrder: "topToBottom" | "bottomToTop" = "topToBottom";
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  missingDataMarker?: { height: number };
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: StackTooltipData) => string;
  plugins?: MichiVzPlugin<VerticalStackBarChartProps>[];
  locale?: string;
  margin?: Margin;
  xAxisLabelPadding?: number;
  xAxisMode?: "auto" | "horizontal";
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  xAxisDomain?: string[];
  yAxisDomain?: [number, number];
  colors?: string[];
  minBarWidth?: number;
  minBarHeight?: number;
  minBarHeightZero?: number;
  filter?: { limit: number; sortingDir: "asc" | "desc"; date?: string };
  enableTransitions?: boolean;
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: VerticalStackBarDataSet[] | null | undefined) => boolean);
  noDataLabel?: string;
  fontFamily?: string;
  yTicks?: number;
  showGridLines?: boolean;
  highlightZeroLine?: boolean;

  private chart?: ChartInstance<VerticalStackBarChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): VerticalStackBarChartProps {
    return {
      dataSet: this.dataSet,
      keys: this.keys,
      keysOrder: this.keysOrder,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      missingDataMarker: this.missingDataMarker,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      locale: this.locale,
      margin: this.margin,
      xAxisLabelPadding: this.xAxisLabelPadding,
      xAxisMode: this.xAxisMode,
      xAxisFormat: this.xAxisFormat,
      yAxisFormat: this.yAxisFormat,
      xAxisDomain: this.xAxisDomain,
      yAxisDomain: this.yAxisDomain,
      colors: this.colors,
      minBarWidth: this.minBarWidth,
      minBarHeight: this.minBarHeight,
      minBarHeightZero: this.minBarHeightZero,
      filter: this.filter,
      enableTransitions: this.enableTransitions,
      isLoading: this.isLoading,
      isNodata: this.isNodata,
      noDataLabel: this.noDataLabel,
      fontFamily: this.fontFamily,
      yTicks: this.yTicks,
      showGridLines: this.showGridLines,
      highlightZeroLine: this.highlightZeroLine,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onLegendDataChange: (l) => this.emit("michi-vz:legend", l),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host)
      this.chart = mountVerticalStackBarChart(host, this.chartProps, { plugins: this.plugins });
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

if (
  typeof customElements !== "undefined" &&
  !customElements.get("michi-vz-vertical-stack-bar-chart")
) {
  customElements.define("michi-vz-vertical-stack-bar-chart", VerticalStackBarChartElement);
}
