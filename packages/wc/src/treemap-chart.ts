// <michi-vz-treemap-chart> - native web component (Lit, LIGHT DOM) over the
// @michi-vz/core Treemap engine. Hierarchical squarified tiling with an optional
// two-part (e.g. realized/untapped) split per leaf, plus a mobile-friendly stack
// layout.
import { LitElement, html, type PropertyValues } from "lit";
import { mountTreemapChart } from "@michi-vz/core";
import type {
  AgentTool,
  TreemapChartProps,
  TreemapNode,
  TreemapLeafContext,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
  Margin,
} from "@michi-vz/core";

export class TreemapChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    layout: { type: String },
    stackBreakpoint: { type: Number, attribute: "stack-breakpoint" },
    splitLabels: { attribute: false },
    splitOpacity: { type: Number, attribute: "split-opacity" },
    showSplit: { type: Boolean, attribute: "show-split" },
    showLegend: { type: Boolean, attribute: "show-legend" },
    minTileShare: { type: Number, attribute: "min-tile-share" },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    valueFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
    margin: { attribute: false },
    colors: { attribute: false },
    paddingInner: { type: Number, attribute: "padding-inner" },
    paddingTop: { type: Number, attribute: "padding-top" },
    filter: { attribute: false },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
  };

  dataSet: TreemapNode[] = [];
  chartTitle = "";
  width = 900;
  height = 520;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  layout: "squarify" | "stack" | "auto" = "squarify";
  stackBreakpoint?: number;
  splitLabels?: [string, string];
  splitOpacity?: number;
  showSplit?: boolean;
  showLegend = false;
  minTileShare?: number;
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  skipColorMappingDispatch = false;
  tooltipFormatter?: (leaf: TreemapLeafContext) => string;
  valueFormatter?: (n: number) => string;
  plugins?: MichiVzPlugin<TreemapChartProps>[];
  locale?: string;
  margin?: Margin;
  colors?: string[];
  paddingInner?: number;
  paddingTop?: number;
  filter?: { limit: number; sortingDir: "asc" | "desc" };
  enableTransitions?: boolean;

  private chart?: ChartInstance<TreemapChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): TreemapChartProps {
    return {
      dataSet: this.dataSet,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      layout: this.layout,
      stackBreakpoint: this.stackBreakpoint,
      splitLabels: this.splitLabels,
      splitOpacity: this.splitOpacity,
      showSplit: this.showSplit,
      showLegend: this.showLegend,
      minTileShare: this.minTileShare,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      valueFormatter: this.valueFormatter,
      locale: this.locale,
      margin: this.margin,
      colors: this.colors,
      paddingInner: this.paddingInner,
      paddingTop: this.paddingTop,
      filter: this.filter,
      enableTransitions: this.enableTransitions,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host) this.chart = mountTreemapChart(host, this.chartProps, { plugins: this.plugins });
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-treemap-chart")) {
  customElements.define("michi-vz-treemap-chart", TreemapChartElement);
}
