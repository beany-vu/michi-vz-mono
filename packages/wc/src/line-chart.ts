// <michi-vz-line-chart> — native web component (Lit, LIGHT DOM) over the
// @michi-vz/core LineChart engine. Same shape as <michi-vz-gap-chart>: light DOM
// preserves the consumer colour contract + canvas probe; no decorators; mounts
// the imperative engine into a stable host <div>.
import { LitElement, html, type PropertyValues } from "lit";
import { mountLineChart } from "@michi-vz/core";
import type {
  LineChartProps,
  LineDataItem,
  DataPoint,
  CurveType,
  ChartContext,
  ChartInstance,
  XaxisDataType,
  SinglePointLineConfig,
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
    locale: { type: String },
  };

  dataSet: LineDataItem[] = [];
  chartTitle = "";
  width = 1000;
  height = 500;
  renderer: "svg" | "canvas" = "svg";
  xAxisDataType: XaxisDataType = "number";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  curve?: CurveType;
  detectGaps = false;
  expectedStep?: number;
  showDataPoints = false;
  enableMouseLine = false;
  singlePointLine?: boolean | SinglePointLineConfig;
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: DataPoint, series: DataPoint[], dataSet: LineDataItem[]) => string;
  locale?: string;

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
      locale: this.locale,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host) this.chart = mountLineChart(host, this.chartProps);
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
}

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-line-chart")) {
  customElements.define("michi-vz-line-chart", LineChartElement);
}
