// <michi-vz-vertical-stack-bar-chart> — native web component (Lit, LIGHT DOM)
// over the @michi-vz/core VerticalStackBar engine.
import { LitElement, html, type PropertyValues } from "lit";
import { mountVerticalStackBarChart } from "@michi-vz/core";
import type {
  VerticalStackBarChartProps,
  VerticalStackBarDataSet,
  StackRectData,
  ChartContext,
  ChartInstance,
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
    locale: { type: String },
  };

  dataSet: VerticalStackBarDataSet[] = [];
  keys?: string[];
  keysOrder: "topToBottom" | "bottomToTop" = "topToBottom";
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" = "svg";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  missingDataMarker?: { height: number };
  skipColorMappingDispatch = false;
  tooltipFormatter?: (rect: StackRectData) => string;
  locale?: string;

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
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onLegendDataChange: (l) => this.emit("michi-vz:legend", l),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host) this.chart = mountVerticalStackBarChart(host, this.chartProps);
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
  !customElements.get("michi-vz-vertical-stack-bar-chart")
) {
  customElements.define("michi-vz-vertical-stack-bar-chart", VerticalStackBarChartElement);
}
