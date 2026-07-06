// <michi-vz-radial-tree-chart> - Lit, LIGHT DOM, over the @michi-vz/core
// RadialTree engine. A radial cluster()/dendrogram: `dataSet` is a forest of
// group nodes with `children` leaves (deeper nesting tolerated).
import { LitElement, html, type PropertyValues } from "lit";
import { mountRadialTreeChart } from "@michi-vz/core";
import type {
  AgentTool,
  RadialTreeNode,
  RadialTreeChartProps,
  ChartContext,
  ChartInstance,
  Margin,
  MichiVzPlugin,
} from "@michi-vz/core";

export class RadialTreeChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    centerLabel: { type: String, attribute: "center-label" },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    radiusRange: { attribute: false },
    labelDensityThresholds: { attribute: false },
    colorsMapping: { attribute: false },
    colors: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
    margin: { attribute: false },
    isLoading: { type: Boolean, attribute: "is-loading" },
    isNodata: { attribute: false },
    noDataLabel: { type: String, attribute: "no-data-label" },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
  };

  dataSet: RadialTreeNode[] = [];
  centerLabel?: string;
  chartTitle = "";
  width = 900;
  height = 520;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  radiusRange?: [number, number];
  labelDensityThresholds?: RadialTreeChartProps["labelDensityThresholds"];
  colorsMapping?: Record<string, string>;
  colors?: string[];
  highlightItems?: string[];
  disabledItems?: string[];
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: RadialTreeNode) => string;
  plugins?: MichiVzPlugin<RadialTreeChartProps>[];
  locale?: string;
  margin?: Margin;
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: RadialTreeNode[] | null | undefined) => boolean);
  noDataLabel?: string;
  enableTransitions?: boolean;

  private chart?: ChartInstance<RadialTreeChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): RadialTreeChartProps {
    return {
      dataSet: this.dataSet,
      centerLabel: this.centerLabel,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      radiusRange: this.radiusRange,
      labelDensityThresholds: this.labelDensityThresholds,
      colorsMapping: this.colorsMapping,
      colors: this.colors,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      locale: this.locale,
      margin: this.margin,
      isLoading: this.isLoading,
      isNodata: this.isNodata,
      noDataLabel: this.noDataLabel,
      enableTransitions: this.enableTransitions,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host)
      this.chart = mountRadialTreeChart(host, this.chartProps, {
        plugins: this.plugins,
      });
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-radial-tree-chart")) {
  customElements.define("michi-vz-radial-tree-chart", RadialTreeChartElement);
}
