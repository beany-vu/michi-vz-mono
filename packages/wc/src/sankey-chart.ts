// <michi-vz-sankey-chart> — native web component (Lit, LIGHT DOM) over the
// @michi-vz/core Sankey engine. Nodes in columns with flow-proportional link bands.
import { LitElement, html, type PropertyValues } from "lit";
import { mountSankeyChart } from "@michi-vz/core";
import type {
  AgentTool,
  Margin,
  SankeyChartProps,
  SankeyNodeItem,
  SankeyLinkItem,
  SankeyNodeContext,
  SankeyLinkContext,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
} from "@michi-vz/core";

export class SankeyChartElement extends LitElement {
  static properties = {
    nodes: { attribute: false },
    links: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    nodeWidth: { type: Number, attribute: "node-width" },
    nodePadding: { type: Number, attribute: "node-padding" },
    nodeRadius: { type: Number, attribute: "node-radius" },
    linkRadius: { type: Number, attribute: "link-radius" },
    linkColorMode: { type: String, attribute: "link-color-mode" },
    linkOpacity: { type: Number, attribute: "link-opacity" },
    showLabels: { type: Boolean, attribute: "show-labels" },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    margin: { attribute: false },
    colors: { attribute: false },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
    tooltipFormatter: { attribute: false },
    valueFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
  };

  nodes: SankeyNodeItem[] = [];
  links: SankeyLinkItem[] = [];
  chartTitle = "";
  width = 800;
  height = 500;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  nodeWidth?: number;
  nodePadding?: number;
  nodeRadius?: number;
  linkRadius?: number;
  linkColorMode: "source" | "target" = "source";
  linkOpacity?: number;
  showLabels?: boolean;
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  skipColorMappingDispatch = false;
  margin?: Margin;
  colors?: string[];
  enableTransitions?: boolean;
  tooltipFormatter?: (mark: SankeyNodeContext | SankeyLinkContext) => string;
  valueFormatter?: (n: number) => string;
  plugins?: MichiVzPlugin<SankeyChartProps>[];
  locale?: string;

  private chart?: ChartInstance<SankeyChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): SankeyChartProps {
    return {
      nodes: this.nodes,
      links: this.links,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      nodeWidth: this.nodeWidth,
      nodePadding: this.nodePadding,
      nodeRadius: this.nodeRadius,
      linkRadius: this.linkRadius,
      linkColorMode: this.linkColorMode,
      linkOpacity: this.linkOpacity,
      showLabels: this.showLabels,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      margin: this.margin,
      colors: this.colors,
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
    if (host) this.chart = mountSankeyChart(host, this.chartProps, { plugins: this.plugins });
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-sankey-chart")) {
  customElements.define("michi-vz-sankey-chart", SankeyChartElement);
}
