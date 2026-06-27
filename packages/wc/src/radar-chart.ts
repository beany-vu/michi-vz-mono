// <michi-vz-radar-chart> — Lit, LIGHT DOM, over the @michi-vz/core RadarChart engine.
import { LitElement, html, type PropertyValues } from "lit";
import { mountRadarChart } from "@michi-vz/core";
import type {
  AgentTool,
  RadarChartProps,
  RadarDataItem,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
} from "@michi-vz/core";

export class RadarChartElement extends LitElement {
  static properties = {
    series: { attribute: false },
    axes: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    maxValue: { type: Number, attribute: "max-value" },
    rings: { type: Number },
    fillOpacity: { type: Number, attribute: "fill-opacity" },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
  };

  series: RadarDataItem[] = [];
  axes: string[] = [];
  chartTitle = "";
  width = 600;
  height = 600;
  renderer: "svg" | "canvas" = "svg";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  maxValue?: number;
  rings?: number;
  fillOpacity?: number;
  skipColorMappingDispatch = false;
  tooltipFormatter?: (item: RadarDataItem) => string;
  plugins?: MichiVzPlugin<RadarChartProps>[];
  locale?: string;

  private chart?: ChartInstance<RadarChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): RadarChartProps {
    return {
      series: this.series,
      axes: this.axes,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      maxValue: this.maxValue,
      rings: this.rings,
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
    if (host) this.chart = mountRadarChart(host, this.chartProps, { plugins: this.plugins });
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-radar-chart")) {
  customElements.define("michi-vz-radar-chart", RadarChartElement);
}
