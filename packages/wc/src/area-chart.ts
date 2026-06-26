// <michi-vz-area-chart> — native web component (Lit, LIGHT DOM) over the
// @michi-vz/core AreaChart engine. Same pattern as the other elements.
import { LitElement, html, type PropertyValues } from "lit";
import { mountAreaChart } from "@michi-vz/core";
import type {
  AreaChartProps,
  AreaDataRow,
  CurveType,
  ChartContext,
  ChartInstance,
  XaxisDataType,
} from "@michi-vz/core";

export class AreaChartElement extends LitElement {
  static properties = {
    series: { attribute: false },
    keys: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    xAxisDataType: { type: String, attribute: "x-axis-data-type" },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    curve: { type: String },
    forcePercentageScale: { type: Boolean, attribute: "force-percentage-scale" },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    locale: { type: String },
  };

  series: AreaDataRow[] = [];
  keys: string[] = [];
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" = "svg";
  xAxisDataType: XaxisDataType = "number";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  curve?: CurveType;
  forcePercentageScale = false;
  skipColorMappingDispatch = false;
  tooltipFormatter?: (row: AreaDataRow, key: string, series: AreaDataRow[]) => string;
  locale?: string;

  private chart?: ChartInstance<AreaChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): AreaChartProps {
    return {
      series: this.series,
      keys: this.keys,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      xAxisDataType: this.xAxisDataType,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      curve: this.curve,
      forcePercentageScale: this.forcePercentageScale,
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
    if (host) this.chart = mountAreaChart(host, this.chartProps);
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-area-chart")) {
  customElements.define("michi-vz-area-chart", AreaChartElement);
}
