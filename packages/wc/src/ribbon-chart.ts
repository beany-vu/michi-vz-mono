// <michi-vz-ribbon-chart> — Lit, LIGHT DOM, over the @michi-vz/core RibbonChart engine.
import { LitElement, html, type PropertyValues } from "lit";
import { mountRibbonChart } from "@michi-vz/core";
import type {
  AgentTool,
  RibbonChartProps,
  RibbonDataRow,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
} from "@michi-vz/core";

export class RibbonChartElement extends LitElement {
  static properties = {
    series: { attribute: false },
    keys: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    columnWidth: { type: Number, attribute: "column-width" },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
  };

  series: RibbonDataRow[] = [];
  keys: string[] = [];
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" = "svg";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  columnWidth?: number;
  skipColorMappingDispatch = false;
  tooltipFormatter?: (row: RibbonDataRow, key: string, value: number) => string;
  plugins?: MichiVzPlugin<RibbonChartProps>[];
  locale?: string;

  private chart?: ChartInstance<RibbonChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): RibbonChartProps {
    return {
      series: this.series,
      keys: this.keys,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      columnWidth: this.columnWidth,
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
    if (host) this.chart = mountRibbonChart(host, this.chartProps, { plugins: this.plugins });
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-ribbon-chart")) {
  customElements.define("michi-vz-ribbon-chart", RibbonChartElement);
}
