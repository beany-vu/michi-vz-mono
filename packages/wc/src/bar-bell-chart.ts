// <michi-vz-bar-bell-chart> — Lit, LIGHT DOM, over the @michi-vz/core BarBell engine.
import { LitElement, html, type PropertyValues } from "lit";
import { mountBarBellChart } from "@michi-vz/core";
import type {
  AgentTool,
  BarBellChartProps,
  BarBellDataRow,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
} from "@michi-vz/core";

export class BarBellChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    keys: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
  };

  dataSet: BarBellDataRow[] = [];
  keys: string[] = [];
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" = "svg";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  skipColorMappingDispatch = false;
  tooltipFormatter?: (row: BarBellDataRow, key: string, value: number) => string;
  plugins?: MichiVzPlugin<BarBellChartProps>[];
  locale?: string;

  private chart?: ChartInstance<BarBellChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): BarBellChartProps {
    return {
      dataSet: this.dataSet,
      keys: this.keys,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
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
    if (host) this.chart = mountBarBellChart(host, this.chartProps, { plugins: this.plugins });
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-bar-bell-chart")) {
  customElements.define("michi-vz-bar-bell-chart", BarBellChartElement);
}
