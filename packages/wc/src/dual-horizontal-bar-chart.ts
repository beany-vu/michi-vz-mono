// <michi-vz-dual-horizontal-bar-chart> — Lit, LIGHT DOM, over the @michi-vz/core
// DualHorizontalBar (tornado) engine.
import { LitElement, html, type PropertyValues } from "lit";
import { mountDualHorizontalBarChart } from "@michi-vz/core";
import type {
  AgentTool,
  DualBarChartProps,
  DualBarDataPoint,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
} from "@michi-vz/core";

export class DualHorizontalBarChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    value1Opacity: { type: Number, attribute: "value1-opacity" },
    value2Opacity: { type: Number, attribute: "value2-opacity" },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
  };

  dataSet: DualBarDataPoint[] = [];
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" = "svg";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  value1Opacity?: number;
  value2Opacity?: number;
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: DualBarDataPoint) => string;
  plugins?: MichiVzPlugin<DualBarChartProps>[];
  locale?: string;

  private chart?: ChartInstance<DualBarChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): DualBarChartProps {
    return {
      dataSet: this.dataSet,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      value1Opacity: this.value1Opacity,
      value2Opacity: this.value2Opacity,
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
    if (host)
      this.chart = mountDualHorizontalBarChart(host, this.chartProps, { plugins: this.plugins });
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
  !customElements.get("michi-vz-dual-horizontal-bar-chart")
) {
  customElements.define("michi-vz-dual-horizontal-bar-chart", DualHorizontalBarChartElement);
}
