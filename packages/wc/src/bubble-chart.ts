// <michi-vz-bubble-chart> — native web component (Lit, LIGHT DOM) over the
// @michi-vz/core Bubble engine. Circles sized by value, clustered by gravity, with
// an optional realized/untapped split per bubble.
import { LitElement, html, type PropertyValues } from "lit";
import { mountBubbleChart } from "@michi-vz/core";
import type {
  AgentTool,
  BubbleChartProps,
  BubbleDataItem,
  BubbleContext,
  ChartContext,
  ChartInstance,
  Margin,
  MichiVzPlugin,
} from "@michi-vz/core";

export class BubbleChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    gravity: { type: Number },
    chargeStrength: { type: Number, attribute: "charge-strength" },
    padding: { type: Number },
    fillRatio: { type: Number, attribute: "fill-ratio" },
    splitLabels: { attribute: false },
    splitOpacity: { type: Number, attribute: "split-opacity" },
    showSplit: { type: Boolean, attribute: "show-split" },
    showLegend: { type: Boolean, attribute: "show-legend" },
    showLabels: { type: Boolean, attribute: "show-labels" },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    margin: { attribute: false },
    colors: { attribute: false },
    filter: { attribute: false },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
    tooltipFormatter: { attribute: false },
    valueFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
  };

  dataSet: BubbleDataItem[] = [];
  chartTitle = "";
  width = 700;
  height = 500;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  gravity?: number;
  chargeStrength?: number;
  padding?: number;
  fillRatio?: number;
  splitLabels?: [string, string];
  splitOpacity?: number;
  showSplit?: boolean;
  showLegend = false;
  showLabels?: boolean;
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  skipColorMappingDispatch = false;
  margin?: Margin;
  colors?: string[];
  filter?: { limit: number; sortingDir: "asc" | "desc" };
  enableTransitions?: boolean;
  tooltipFormatter?: (bubble: BubbleContext) => string;
  valueFormatter?: (n: number) => string;
  plugins?: MichiVzPlugin<BubbleChartProps>[];
  locale?: string;

  private chart?: ChartInstance<BubbleChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): BubbleChartProps {
    return {
      dataSet: this.dataSet,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      gravity: this.gravity,
      chargeStrength: this.chargeStrength,
      padding: this.padding,
      fillRatio: this.fillRatio,
      splitLabels: this.splitLabels,
      splitOpacity: this.splitOpacity,
      showSplit: this.showSplit,
      showLegend: this.showLegend,
      showLabels: this.showLabels,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      margin: this.margin,
      colors: this.colors,
      filter: this.filter,
      enableTransitions: this.enableTransitions,
      tooltipFormatter: this.tooltipFormatter,
      valueFormatter: this.valueFormatter,
      locale: this.locale,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host) this.chart = mountBubbleChart(host, this.chartProps, { plugins: this.plugins });
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-bubble-chart")) {
  customElements.define("michi-vz-bubble-chart", BubbleChartElement);
}
