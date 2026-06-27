// <michi-vz-fan-chart> — native web component (Lit, LIGHT DOM) over the
// @michi-vz/core FanChart engine (history line + dashed forecast median + nested
// confidence bands). Same shape as the other elements; light DOM preserves the
// consumer colour contract. Also forwards an opt-in `plugins` array.
import { LitElement, html, type PropertyValues } from "lit";
import { mountFanChart } from "@michi-vz/core";
import type {
  AgentTool,
  ChartContext,
  ChartInstance,
  CurveType,
  FanChartProps,
  FanDataItem,
  Margin,
  MichiVzPlugin,
  XaxisDataType,
} from "@michi-vz/core";

export class FanChartElement extends LitElement {
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
    fillOpacity: { type: Number, attribute: "fill-opacity" },
    showDataPoints: { type: Boolean, attribute: "show-data-points" },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    margin: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
  };

  dataSet: FanDataItem[] = [];
  chartTitle = "";
  width = 1000;
  height = 500;
  renderer: "svg" | "canvas" = "svg";
  xAxisDataType: XaxisDataType = "number";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  curve?: CurveType;
  fillOpacity?: number;
  showDataPoints = false;
  skipColorMappingDispatch = false;
  margin?: Margin;
  plugins?: MichiVzPlugin<FanChartProps>[];
  locale?: string;

  private chart?: ChartInstance<FanChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): FanChartProps {
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
      fillOpacity: this.fillOpacity,
      showDataPoints: this.showDataPoints,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      margin: this.margin,
      locale: this.locale,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host) this.chart = mountFanChart(host, this.chartProps, { plugins: this.plugins });
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-fan-chart")) {
  customElements.define("michi-vz-fan-chart", FanChartElement);
}
