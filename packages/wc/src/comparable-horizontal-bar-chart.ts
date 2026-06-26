// <michi-vz-comparable-horizontal-bar-chart> — Lit, LIGHT DOM, over the
// @michi-vz/core ComparableHorizontalBar engine.
import { LitElement, html, type PropertyValues } from "lit";
import { mountComparableHorizontalBarChart } from "@michi-vz/core";
import type {
  ComparableBarChartProps,
  ComparableBarDataPoint,
  ChartContext,
  ChartInstance,
} from "@michi-vz/core";

export class ComparableHorizontalBarChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    valueBasedOpacity: { type: Number, attribute: "value-based-opacity" },
    valueComparedOpacity: { type: Number, attribute: "value-compared-opacity" },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    locale: { type: String },
  };

  dataSet: ComparableBarDataPoint[] = [];
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" = "svg";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  valueBasedOpacity?: number;
  valueComparedOpacity?: number;
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: ComparableBarDataPoint) => string;
  locale?: string;

  private chart?: ChartInstance<ComparableBarChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): ComparableBarChartProps {
    return {
      dataSet: this.dataSet,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      valueBasedOpacity: this.valueBasedOpacity,
      valueComparedOpacity: this.valueComparedOpacity,
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
    if (host) this.chart = mountComparableHorizontalBarChart(host, this.chartProps);
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

if (
  typeof customElements !== "undefined" &&
  !customElements.get("michi-vz-comparable-horizontal-bar-chart")
) {
  customElements.define("michi-vz-comparable-horizontal-bar-chart", ComparableHorizontalBarChartElement);
}
