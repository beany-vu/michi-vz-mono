// <michi-vz-range-chart> — Lit, LIGHT DOM, over the @michi-vz/core RangeChart engine.
import { LitElement, html, type PropertyValues } from "lit";
import { mountRangeChart } from "@michi-vz/core";
import type {
  RangeChartProps,
  RangeDataItem,
  RangeDataPoint,
  CurveType,
  ChartContext,
  ChartInstance,
  XaxisDataType,
} from "@michi-vz/core";

export class RangeChartElement extends LitElement {
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
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    locale: { type: String },
  };

  dataSet: RangeDataItem[] = [];
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
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: RangeDataPoint, item: RangeDataItem) => string;
  locale?: string;

  private chart?: ChartInstance<RangeChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): RangeChartProps {
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
    if (host) this.chart = mountRangeChart(host, this.chartProps);
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-range-chart")) {
  customElements.define("michi-vz-range-chart", RangeChartElement);
}
